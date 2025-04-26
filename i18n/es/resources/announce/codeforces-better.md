## 1.79.0

- Eliminar la dependencia del repositorio de scripts Greasyfork
- Sustituir la fuente de actualización por defecto por AliCloud OSS
- Solucionar el problema del estilo incorrecto de los botones en algunas páginas de título
- Mejoras：Ajuste de la palabra de aviso por defecto GPT
- Mejoras：Indicar claramente cuándo se agota el tiempo del código en línea

## 1.77.0

- Añadir la opción "Comprobador de resultados de pruebas de muestras".
- Fix embellecimiento de bloques de código no cambiar de tema correctamente cuando el modo oscuro es "Seguir el sistema"
- Solucionar el problema de que "Reemplazo de texto de estado de revisión" no se reemplaza correctamente.
- Solucionar el problema del error de traducción de Arigatou
- Solucionar el problema de que el resultado de la traducción no se muestra en la parte de respuesta del comentario en modo segmentado.
- Arreglar el problema de la falta del último comentario en la página de diferenciación de comentarios.
- Corrección de la sobreescritura del color LaTeX en modo oscuro.
- Se soluciona el problema de que el intervalo de espera no es válido en el modo "Traducción segmentada".
- Corrección de un problema al consultar los saldos de la API, gracias a **@x1uc**.
- Solucionar conflicto de nombres de clases de superposición
- Mejora de las normas de localización del sitio web, ¡gracias a **@xiezheyuan**, **@Acfboy** por su contribución!

## 1.76.0

- \*_Sustituir el repositorio público CDN a [SUSTech Mirror](https://mirrors.sustech.edu.cn/help/cdnjs.html), ver [issue](https://github.com/beijixiaohu/OJBetter/issues/151)_ por razones. \*

- Añadida la función "Sustitución del texto del estado de revisión", gracias a la colaboración de **@wrk-123**.

- Ajustar la estructura de la página de configuración

## 1.75.0

- Mejora de algunas normas de localización de sitios web, gracias a la contribución de **@qjwh**.
- Añadir las opciones "Personalización del aviso de traducción de ChatGPT" y "Como aviso del sistema" ¡Gracias a **@Dawn-Xu-helloworld** por la colaboración!
- Añadir la función "Forzar conversión Turndown" ¡Gracias a **@wrk-123** por la contribución!
- Añadir ventana emergente de confirmación de envío de código para mostrar el nombre del título.
- Añadir muestra mediante la opción Auto-Commit (desactivada por defecto)
- Añadir la función "Ocultar etiquetas de preguntas temáticas", desactivada por defecto.
- Sustitución de la interfaz de "Yodo Translator".
- Arreglar títulos de gimnasios que no saltan a vjudge
- &nbsp;Corrección de símbolos ` ` en el embellecimiento de bloques de código
- Solucionar el problema de que las fuentes de problemset no se pueden enviar correctamente cuando la longitud del número de la pregunta no es 1 ¡Gracias a **@WindJ0Y** por la contribución!
- Fix Monaco editor not applying theme correctly when theme is set to follow ¡Gracias a **@cscnk52** por la contribución!
- Corregir el editor de código no se carga correctamente cuando los enlaces de título conjunto de títulos están en minúsculas.
- Se corrige el problema de que LaTeX no sustituye correctamente entre líneas y se solucionan problemas de rendimiento con reglas relacionadas.
- Corregir error al retraducir "Recopilar resultados antiguos".
- Solucionar el problema de que el botón de copiar no funciona en la página de presentación
- Corrección de etiquetas de script no filtradas durante la conversión MarkDown
- Utilizar polyfill para compatibilidad con navegadores que no soportan el método dialog.showModal() (por ejemplo Firefox79).

## 1.74.2

- Gracias a @Dechancer por sus comentarios.

## 1.74.1

- Arreglar pre normal con fondo blanco en modo oscuro cuando el embellecimiento de bloques de código no está activado.

## 1.74.0

- Añadir botón para saltar a VJudge
- Añade la función "embellecer bloque de código", utiliza el editor monaco para reemplazar el bloque de código previo en la página, esto también mejorará el efecto de visualización del código en modo oscuro.
- Mejoras en varios métodos de solicitud en Clist Rating para solucionar problemas con la obtención incorrecta de datos.
- Mejora de la rapidez de las traducciones de ChatGPT y corrección de un posible error de inyección que podía dar lugar a traducciones incompletas.
- Mejoras en el código relacionado con LaTeX Replace/Restore, que ahora restaura correctamente en caso de anidamiento múltiple.
- Mejora de la solidez de los métodos de localización de sitios web
- Ajuste del código relacionado con el modo oscuro, utilizando variables para facilitar la uniformidad de estilo y gestión.
- Sustituir CDN staticfile.org por staticfile.net
- Los datos MarkDown ya no contienen bloques de códigos interlínea
- Eliminar los métodos relacionados con la determinación de si el texto es código o no
- Soluciona el problema de que la clasificación de algunos temas en la página de la lista de preguntas aparezca como no encontrada.
- Solucionar el problema de la visualización anormal de las puntuaciones clist en la página de conjunto de preguntas.
- Solucionar el problema de los estilos de comparación de diferencias no alineados en las pruebas en línea de código.
- Solucionar el problema por el que deepl 429 no muestra correctamente el mensaje de alerta tras informar de un error.
- Se corrige un problema por el que la página de título Clist Clasificación puede mostrar No encontrado
- Se ha solucionado el problema por el que el método de salto de Rock Valley informaba de un error en versiones antiguas de Tampermonkey.
- Corrección de un bucle muerto inesperado que provocaba el bloqueo de la página cuando el archivo de la biblioteca MathJax no se cargaba correctamente.
- Se ha corregido el problema por el que DeepL no mostraba correctamente el mensaje de alerta durante la traducción al traducir en modo libre.
- Se corrige un problema por el que los scripts podían no cargarse correctamente.
- Se corrige un problema por el que podía corromperse la tipografía entre fórmulas LaTeX vecinas.
- Algunos otros ajustes y mejoras

## 1.73.0

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
- Mejorar cada función de carga, eliminar algunas relaciones de espera innecesarias, acelerar el tiempo de carga del script
- Mejoras en la función de traducción y en la visualización de mensajes de error.
- Mejora del rendimiento de la traducción automática y el problema de que no se traduzca automáticamente
- Mejoras en las muestras de código relacionadas con la ejecución en línea
- Método mejorado para comparar las diferencias en los resultados de la ejecución codeDiff()
- El contenido de fondo de la ventana de diálogo mejorado ya no se desplaza con el ratón.
- Mejorar el estilo del editor de código cuando se fija a la derecha, abajo y a pantalla completa, ¡gracias a @lishufood por la sugerencia!
- Mejora de la visualización del panel .html2md-panel en modo simple
- Mejorar el estilo de la página de configuración en el panel de ajustes
- Corregir errores del editor de la página de título acmsguru
- Se ha solucionado el problema por el que el editor de código de la página de incidencias informaba de un error tras cambiar la versión móvil/desktop del sitio web.
- Corrección de un error en el método getMarkdown(), que almacenaba incorrectamente los datos directamente en el DOM, lo que provocaba una degradación del rendimiento.
- Solucionado el problema de que el botón de traducción dentro del bloque plegado no se muestra después de desactivar 'Autoexpansión del bloque plegado', ¡gracias a los comentarios de @MoYuToGo!
- Dado que la opción "No esperar a que los recursos de la página se carguen completamente" carece teóricamente de sentido, se ha renombrado para desmarcar el estado anteriormente posible
- Ajuste de un gran número de estructuras de código
- **mucho cambio de nombre de clases css, por lo que puede que tenga que retocarlo si utiliza estilos personalizados de stylus**
- Otros ajustes y mejoras

## 1.72.0

- Solucionado el problema de que el panel de configuración de ChatGPT no aparece, ¡gracias a los comentarios de @caoxuanming!
- Añada un interruptor de configuración "Bloqueo de desplazamiento del ratón", activado por defecto, gracias a @liuhao6 por la sugerencia.

## 1.71.0

- ¡Actualizado API para la clasificación clist a v4, ajustado cómo los datos se obtiene en la página de título para ser obtenido a través de la API, gracias a @wrkwrk por la sugerencia!
- Añadir la opción "Streaming" de traducción de ChatGPT, activada por defecto
- Fix Google Translate results are empty ¡Gracias a @shicxin por los comentarios!
- Añadir un interruptor de configuración "Doble confirmación para commits de código", activado por defecto ¡Gracias a @Rikkual por la sugerencia!
- Botones para añadir pequeñas áreas a la página completa del conjunto de temas
- Solucionado el problema de que no se muestra el resultado de la traducción cuando se hace clic con el botón derecho del ratón en la página completa del conjunto de temas para imprimir ¡Gracias a @zfs732 por el comentario!

## 1.70.0

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