## 1.73

- Independencia de los datos localizados del sitio web como JSON externo para facilitar el mantenimiento
- Los scripts son compatibles con la internacionalización y utilizan la plataforma crowdin para automatizar la localización.
- Sustituir algunos botones por botones con iconos
- Añada soporte para la API DeepL, incluyendo las oficiales api-free, api-pro y deeplx, ¡gracias a @Vistarin por la sugerencia!
- Añada soporte para deepl y chatgpt para configurar las búsquedas de saldo, tenga en cuenta que esto también requiere que su proveedor de servicios lo soporte y proporcione las API adecuadas
- Añada un juicio sobre el texto antes de traducirlo, si se sospecha que es un fragmento de código, no se traducirá automáticamente y se le pedirá que abra una ventana emergente antes de hacer clic en la traducción.
- Añadir la posibilidad de seleccionar la lengua de destino para los servicios de traducción
- Añada una página sobre, así como un canal de actualización y selecciones de fuente de actualización
- Añada la página de mantenimiento de depuración, que incluye la actualización de la caché, el borrado de datos, la importación y la exportación.
- Añadir opción personalizada： 'Code Editor Submit Button Position', por defecto abajo, ¡gracias a @lishufood por la sugerencia!
- Mejoras en la función de traducción y en la visualización de mensajes de error.
- Mejora del rendimiento de la traducción automática y el problema de que no se traduzca automáticamente
- Mejoras en las muestras de código relacionadas con la ejecución en línea
- Método mejorado para comparar las diferencias en los resultados de la ejecución codeDiff()
- El contenido de fondo de la ventana de diálogo mejorado ya no se desplaza con el ratón.
- Mejorar el estilo del editor de código cuando se fija a la derecha, abajo y a pantalla completa, ¡gracias a @lishufood por la sugerencia!
- Mejora de la visualización del panel .html2md-panel en modo simple
- Mejorar el estilo de la página de configuración en el panel de ajustes
- Se ha solucionado el problema por el que el editor de código de la página de incidencias informaba de un error tras cambiar la versión móvil/desktop del sitio web.
- Corrección de un error en el método getMarkdown(), que almacenaba incorrectamente los datos directamente en el DOM, lo que provocaba una degradación del rendimiento.
- Solucionado el problema de que el botón de traducción dentro del bloque plegado no se muestra después de desactivar 'Autoexpansión del bloque plegado', ¡gracias a los comentarios de @MoYuToGo!
- Dado que la opción "No esperar a que los recursos de la página se carguen completamente" carece teóricamente de sentido, se ha renombrado para desmarcar el estado anteriormente posible
- Ajuste de un gran número de estructuras de código
- **mucho cambio de nombre de clases css, por lo que puede que tenga que retocarlo si utiliza estilos personalizados de stylus**
- Algunos otros ajustes y mejoras

## 1.72

- Solucionado el problema de que el panel de configuración de ChatGPT no aparece, ¡gracias a los comentarios de @caoxuanming!
- Añada un interruptor de configuración "Bloqueo de desplazamiento del ratón", activado por defecto, gracias a @liuhao6 por la sugerencia.

## 1.71

- ¡Actualizado API para la clasificación clist a v4, ajustado cómo los datos se obtiene en la página de título para ser obtenido a través de la API, gracias a @wrkwrk por la sugerencia!
- Añadir la opción "Streaming" de traducción de ChatGPT, activada por defecto
- Fix Google Translate results are empty ¡Gracias a @shicxin por los comentarios!
- Añadir un interruptor de configuración "Doble confirmación para commits de código", activado por defecto ¡Gracias a @Rikkual por la sugerencia!
- Botones para añadir pequeñas áreas a la página completa del conjunto de temas
- Solucionado el problema de que no se muestra el resultado de la traducción cuando se hace clic con el botón derecho del ratón en la página completa del conjunto de temas para imprimir ¡Gracias a @zfs732 por el comentario!

## 1.70

- Añada un editor de código en la parte inferior de la portada para facilitar las pruebas de código en línea, el envío de código, etc. Para más detalles, lea la página de información.
- Se ha solucionado el problema por el que, al insertar botones de script y traducir los resultados, se trataban como cambios en la descripción del título.
- Mejora de la página de gestión de la fusión de carteras
- Añadir la función "Auto-traducir texto corto", desactivada por defecto.
- Implementación mejorada de los intervalos de espera de traducción, ahora los intervalos de espera funcionan globalmente
- Mejoras en la aplicación de "Mostrar el alcance de la zona objetivo"
- Modo oscuro mejorado, estilos hover mejorados en elementos de muestra ¡Gracias a @SUPERLWR por los comentarios!
- Añadir la opción del panel de ajustes: Traducción - Filtrar los signos \*\* en el texto ¡Gracias a @Dog_E, CreMicro por sus comentarios!
- Se ha solucionado el problema por el que no se podía mostrar correctamente la Clasificación de Clist después de desactivar "Mostrar alertas de carga", gracias a los comentarios de Vistarin.
- Algunas otras mejoras y correcciones
