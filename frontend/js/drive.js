const DRIVE_SCOPE = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const MIME_CARPETA = 'application/vnd.google-apps.folder';

let clienteToken = null;
let tokenDrive = null;
let tokenVence = 0;
let pedidoToken = null;
let configDrive = null;
let errorConfigDrive = 'Cargando la configuración de Google Drive, intenta de nuevo en unos segundos.';

fetch('/api/config/drive')
  .then(async (respuesta) => {
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.error);
    configDrive = resultado;
  })
  .catch((error) => {
    errorConfigDrive = error.message || 'No se pudo cargar la configuración de Google Drive.';
  });


function conectarDrive() {
  if (!configDrive) {
    return Promise.reject(new Error(errorConfigDrive));
  }

  if (!window.google?.accounts?.oauth2) {
    return Promise.reject(new Error('No se pudo cargar Google. Revisa tu conexión a internet.'));
  }

  if (tokenDrive && Date.now() < tokenVence) return Promise.resolve(tokenDrive);

  clienteToken ??= google.accounts.oauth2.initTokenClient({
    client_id: configDrive.clientId,
    scope: DRIVE_SCOPE,
    callback: (respuesta) => {
      if (respuesta.error) {
        pedidoToken?.reject(new Error('Google no autorizó el acceso a Drive.'));
        return;
      }

      tokenDrive = respuesta.access_token;
      tokenVence = Date.now() + (respuesta.expires_in - 60) * 1000;
      pedidoToken?.resolve(tokenDrive);
    },
    error_callback: (error) => {
      pedidoToken?.reject(new Error(
        error.type === 'popup_closed'
          ? 'Se canceló el inicio de sesión con Google.'
          : 'No se pudo iniciar sesión con Google.'
      ));
    },
  });

  return new Promise((resolve, reject) => {
    pedidoToken = { resolve, reject };
    clienteToken.requestAccessToken();
  });
}

async function pedirDrive(url, opciones = {}) {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { ...opciones.headers, Authorization: `Bearer ${tokenDrive}` },
  });

  if (respuesta.status === 401) {
    tokenDrive = null;
    throw new Error('La sesión de Google venció. Intenta de nuevo.');
  }

  return respuesta;
}

async function existeEnDrive(driveId) {
  const respuesta = await pedirDrive(`${DRIVE_API}/${driveId}?fields=trashed`);

  if (!respuesta.ok) return false;

  return !(await respuesta.json()).trashed;
}

function cuerpoMultipart(metadatos, blob) {
  const cuerpo = new FormData();
  cuerpo.append('metadata', new Blob([JSON.stringify(metadatos)], { type: 'application/json' }));
  cuerpo.append('file', blob);
  return cuerpo;
}

async function crearZipEnDrive(carpetaId, blob, nombreArchivo) {
  const metadatos = { name: nombreArchivo, mimeType: 'application/zip', parents: [carpetaId] };

  const respuesta = await pedirDrive(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id`, {
    method: 'POST',
    body: cuerpoMultipart(metadatos, blob),
  });

  if (!respuesta.ok) throw new Error('No se pudo guardar el proyecto en Google Drive.');

  return (await respuesta.json()).id;
}

async function actualizarZipEnDrive(driveId, blob, nombreArchivo) {
  const respuesta = await pedirDrive(`${DRIVE_UPLOAD}/${driveId}?uploadType=multipart&fields=id`, {
    method: 'PATCH',
    body: cuerpoMultipart({ name: nombreArchivo }, blob),
  });

  if (!respuesta.ok) throw new Error('No se pudo actualizar el proyecto en Google Drive.');
}

function cargarPicker() {
  if (window.google?.picker) return Promise.resolve();

  if (!window.gapi) {
    return Promise.reject(new Error('No se pudo cargar Google. Revisa tu conexión a internet.'));
  }

  return new Promise((resolve, reject) => {
    gapi.load('picker', { callback: resolve, onerror: () => reject(new Error('No se pudo abrir Google Drive.')) });
  });
}

async function abrirPicker(titulo, crearVista, multiple=false) {
  await conectarDrive();
  await cargarPicker();

  return new Promise((resolve) => {
    new google.picker.PickerBuilder()
      .setTitle(titulo)
      .addView(crearVista())
      .setOAuthToken(tokenDrive)
      .setDeveloperKey(configDrive.apiKey)
      .setAppId(configDrive.appId)
      .setLocale('es')
      .setCallback((datos) => {
        if (datos.action === google.picker.Action.PICKED) resolve(multiple ? datos.docs : datos.docs[0]);
        if (datos.action === google.picker.Action.CANCEL) resolve(null);
      })
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .build()
      .setVisible(true);
  });
}

function elegirZipDeDrive() {
  return abrirPicker('Elige el proyecto a abrir', () =>
    new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setMimeTypes('application/zip,application/x-zip-compressed')
      .setIncludeFolders(true)
  );
}

function elegirCarpetaDrive() {
  return abrirPicker('Elige la carpeta donde guardar el proyecto', () =>
    new google.picker.DocsView(google.picker.ViewId.FOLDERS)
      .setMimeTypes(MIME_CARPETA)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
  );
}

function elegirFotosDeDrive() {
  return abrirPicker('Elige las fotos a subir', () =>
    new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES)
      .setIncludeFolders(true)
  , true);
}

async function descargarDeDrive(driveId) {
  const respuesta = await pedirDrive(`${DRIVE_API}/${driveId}?alt=media`);

  if (!respuesta.ok) throw new Error('No se pudo descargar el archivo de Google Drive.');

  return respuesta.blob();
}

////////////////////////////////////////////////////////


// async function obtenerIdRealPorPadreYNombre(doc) {
//   if (!doc || !doc.parentId || !doc.name) {
//     return null;
//   }

//   const nombreEscapado = doc.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
//   const consulta = encodeURIComponent(
//     `'${doc.parentId}' in parents and name = '${nombreEscapado}' and trashed = false`
//   );

//   const url = `https://www.googleapis.com/drive/v3/files?q=${consulta}&fields=files(id,name,mimeType)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
//   const respuesta = await pedirDrive(url);

//   if (!respuesta.ok) {
//     console.warn('Error al buscar en Drive:', respuesta.status, await respuesta.text());
//     return null;
//   }

//   const datos = await respuesta.json();
//   console.log('RESULTADO BUSQUEDA DRIVE:', datos.files);

//   const coincidencia =
//     datos.files?.find((f) => f.mimeType === doc.mimeType) || datos.files?.[0];

//   return coincidencia?.id || null;
// }

// async function descargarImagenDeDrive(doc) {
//   const esObjeto = typeof doc === 'object' && doc !== null;
//   let fileId = esObjeto ? doc.id : doc;

//   const construirUrl = (id) =>
//     `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`;

//   let respuesta = await pedirDrive(construirUrl(fileId));

//   if (respuesta.status === 404 && esObjeto && doc.parentId && doc.name) {
//     const idReal = await obtenerIdRealPorPadreYNombre(doc);

//     if (idReal && idReal !== fileId) {
//       fileId = idReal;
//       respuesta = await pedirDrive(construirUrl(fileId));
//     }
//   }

//   if (!respuesta.ok) {
//     const detalleError = await respuesta.text();
//     console.error('Error de Google Drive:', respuesta.status, detalleError);
//     throw new Error(`No se pudo descargar el archivo de Google Drive (${respuesta.status}).`);
//   }

//   return respuesta.blob();
// }