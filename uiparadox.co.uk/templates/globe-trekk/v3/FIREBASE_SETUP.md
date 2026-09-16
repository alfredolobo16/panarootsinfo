# Guía de Firebase Authentication para PanaRoots

La web ya incluye la interfaz y la lógica modular para registro, inicio de sesión, cierre de sesión, recuperación de contraseña, persistencia de sesión y contenido visible solo para usuarios autenticados.

Archivos implicados:

```text
v3/
├── account.html
└── assets/
    └── js/
        ├── firebase-config.js
        └── auth.js
```

`account.html` contiene los formularios. `firebase-config.js` guarda la configuración del proyecto. `auth.js` contiene toda la lógica de autenticación.

## 1. Crear el proyecto

1. Abre [Firebase Console](https://console.firebase.google.com/).
2. Inicia sesión con la cuenta de Google que administrará PanaRoots.
3. Pulsa **Create a project** o **Add project**.
4. Usa un nombre claro, por ejemplo `panaroots-web`.
5. Revisa el identificador del proyecto. Ese ID no se puede cambiar después.
6. Google Analytics es opcional para esta primera fase. Firebase Authentication funciona sin activarlo.
7. Termina el asistente y espera a que Firebase cree el proyecto.

## 2. Registrar la aplicación web

1. En la página principal del proyecto, pulsa el icono **Web** (`</>`).
2. Usa un apodo como `PanaRoots Website`.
3. No actives Firebase Hosting todavía si continuarás usando tu servidor actual.
4. Pulsa **Register app**.
5. Firebase mostrará un objeto parecido a este:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Colocar la configuración

Abre `assets/js/firebase-config.js` y reemplaza cada valor `REPLACE_WITH_...` por el valor equivalente que entrega Firebase.

No cambies los nombres de las propiedades. El resultado debe conservar esta forma:

```js
export const firebaseConfig = {
  apiKey: "valor-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "valor-real",
  appId: "valor-real",
};
```

La configuración web identifica el proyecto, pero no sustituye las reglas de seguridad. Nunca pongas contraseñas privadas, claves de servicio ni archivos de cuenta de servicio dentro de esta carpeta pública.

## 4. Activar Email/Password

1. En Firebase Console, abre **Authentication**.
2. Pulsa **Get started** si es la primera vez.
3. Abre la pestaña **Sign-in method**.
4. Selecciona **Email/Password**.
5. Activa **Email/Password**.
6. No es necesario activar **Email link** para esta implementación.
7. Guarda los cambios.

## 5. Configurar dominios autorizados

1. Dentro de **Authentication**, abre **Settings**.
2. Busca **Authorized domains**.
3. Para pruebas locales, confirma que `localhost` aparezca en la lista.
4. Cuando publiques, añade el dominio real de PanaRoots, por ejemplo `panaroots.com` y el subdominio concreto que utilizarás.
5. No añadas dominios que no controles.

## 6. Política de contraseñas

1. En **Authentication > Settings**, abre **Password policy**.
2. Define como mínimo 8 caracteres para coincidir con el formulario actual.
3. Puedes exigir mayúsculas, minúsculas, números o símbolos.
4. Usa el modo **Require** solo cuando estés seguro de que la interfaz comunica todos los requisitos.
5. Mantén activada la protección contra enumeración de correos. Los mensajes de esta web ya usan respuestas genéricas cuando corresponde.

## 7. Probar en local

No abras `account.html` directamente con `file://`. Los módulos JavaScript necesitan un servidor local.

Con Live Server, usa una dirección como:

```text
http://127.0.0.1:5501/uiparadox.co.uk/templates/globe-trekk/v3/account.html
```

Después de colocar la configuración, realiza una recarga completa con `Ctrl+F5`.

## 8. Probar el registro

1. Abre `account.html`.
2. Entra en la pestaña **Register**.
3. Introduce nombre, correo y una contraseña válida.
4. Pulsa **Create account**.
5. Revisa **Firebase Console > Authentication > Users**.
6. El nuevo usuario debe aparecer allí y la web debe mostrar el panel autenticado.

El código usa `createUserWithEmailAndPassword` y después `updateProfile` para guardar el nombre visible.

## 9. Probar el inicio de sesión

1. Cierra la sesión con **Sign out**.
2. Abre **Sign in**.
3. Usa el mismo correo y contraseña.
4. La web usa `signInWithEmailAndPassword`.
5. Si las credenciales son correctas, el panel de usuario y el bloque protegido vuelven a aparecer.

## 10. Probar el cierre de sesión

El botón **Sign out** llama a `signOut`. Al terminar, los formularios vuelven a mostrarse y el contenido con `data-auth-required` se oculta.

## 11. Probar la recuperación de contraseña

1. Abre **Reset password**.
2. Introduce el correo de una cuenta de prueba.
3. Pulsa **Send reset email**.
4. Firebase enviará el mensaje con `sendPasswordResetEmail`.
5. Revisa también spam o promociones.
6. En **Authentication > Templates** puedes personalizar el remitente, asunto y texto del correo antes de producción.

## 12. Manejo de sesiones

`auth.js` usa `browserLocalPersistence`. Esto mantiene la sesión en el navegador después de recargar o cerrar la pestaña, hasta que el usuario cierre sesión o la sesión deje de ser válida.

`onAuthStateChanged` es la fuente de verdad para la interfaz. No se confía únicamente en una variable o en `localStorage` para decidir si alguien está autenticado.

## 13. Mostrar el usuario autenticado

El panel usa los datos del objeto `User` de Firebase:

- `displayName` para el nombre.
- `email` para el correo.
- El estado de `onAuthStateChanged` para mostrar u ocultar bloques.

Para proteger visualmente otro componente, añade `data-auth-required` y `hidden` al elemento:

```html
<section data-auth-required hidden>
  Contenido para usuarios autenticados
</section>
```

## 14. Proteger datos de verdad

Ocultar HTML no es seguridad. Si más adelante guardas favoritos, reservas o itinerarios en Firestore, crea reglas que validen `request.auth.uid`.

Ejemplo conceptual para documentos por usuario:

```text
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null
                     && request.auth.uid == userId;
}
```

Adapta y prueba las reglas en Firebase Emulator Suite antes de producción. Nunca uses reglas abiertas como `allow read, write: if true` en un proyecto publicado.

## 15. Manejo de errores

`auth.js` traduce los errores más comunes a mensajes claros:

- Correo inválido.
- Credenciales inválidas.
- Correo ya registrado.
- Contraseña débil.
- Método de acceso no activado.
- Demasiados intentos.
- Error de red.

Para depurar, abre las herramientas del navegador con `F12` y revisa **Console** y **Network**. No muestres el mensaje técnico completo de Firebase al usuario final.

## 16. Lista de pruebas

Antes de publicar, verifica:

- Crear una cuenta nueva.
- Impedir dos cuentas con el mismo correo.
- Rechazar una contraseña que incumpla la política.
- Iniciar sesión correctamente.
- Rechazar credenciales incorrectas con un mensaje genérico.
- Mantener la sesión después de recargar.
- Cerrar sesión.
- Enviar el correo de recuperación.
- Ocultar contenido protegido al cerrar sesión.
- Probar en Chrome, Edge y un navegador móvil.

## 17. Paso a producción

1. Añade el dominio definitivo en **Authorized domains**.
2. Cambia las plantillas de correo para que usen el nombre PanaRoots.
3. Revisa la política de contraseña y la protección contra enumeración.
4. Configura reglas de Firestore o Storage antes de guardar datos.
5. Activa App Check cuando la aplicación consuma bases de datos, Storage o APIs protegidas.
6. Prueba registro, login, logout y recuperación desde el dominio real.
7. Revisa los límites y alertas del proyecto en Firebase Console.
8. Para una fase de producción con compilación, instala Firebase mediante npm y usa un bundler. La versión actual usa módulos de navegador desde el CDN oficial para encajar con esta web HTML estática.

## Documentación oficial

- [Añadir Firebase a una aplicación web](https://firebase.google.com/docs/web/setup)
- [Autenticación con correo y contraseña](https://firebase.google.com/docs/auth/web/password-auth)
- [Administrar usuarios](https://firebase.google.com/docs/auth/web/manage-users)
- [Introducción a Firebase Authentication para web](https://firebase.google.com/docs/auth/web/start)
- [Buenas prácticas del SDK web](https://firebase.google.com/docs/web/best-practices)
