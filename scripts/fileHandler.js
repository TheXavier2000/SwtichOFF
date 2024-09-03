var jsonObject = null;  // Declaración global
var hostIds = [];  // Definición global para almacenar los IDs de los hosts

document.addEventListener('DOMContentLoaded', () => {
    let dropArea = document.getElementById('drop-area');
    let fileElem = document.getElementById('fileElem');
    let processButton = document.getElementById('process-hosts'); // Botón para procesar
    let uploadButton = document.getElementById('uploadButton'); // Botón para cargar

    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            if (fileElem) {
                fileElem.click();
            }
        });
    }

    if (fileElem) {
        fileElem.addEventListener('change', () => handleFiles(fileElem.files), false);
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        if (dropArea) {
            dropArea.addEventListener(eventName, highlight, false);
        }
    });

    ['dragleave', 'drop'].forEach(eventName => {
        if (dropArea) {
            dropArea.addEventListener(eventName, unhighlight, false);
        }
    });

    if (dropArea) {
        dropArea.addEventListener('drop', handleDrop, false);
    }

    if (processButton) {
        processButton.addEventListener('click', processJson);  // Procesar al hacer clic
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        if (dropArea) {
            dropArea.classList.add('highlight');
        }
    }

    function unhighlight() {
        if (dropArea) {
            dropArea.classList.remove('highlight');
        }
    }

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        let file = files[0];
        if (file && file.type === 'application/json') {
            let reader = new FileReader();
    
            // Deshabilitar el botón de cargar archivo
            uploadButton.disabled = true;
            processButton.disabled = true; // Deshabilitar el botón de procesar mientras se carga el JSON
    
            reader.onload = function(event) {
                try {
                    let jsonString = event.target.result;
                    jsonObject = JSON.parse(jsonString); // Almacenar JSON en variable global
    
                    alert("Archivo JSON cargado correctamente. Ahora puedes procesar los datos.");
                    processButton.disabled = false; // Habilitar el botón de procesar
                    
                } catch (error) {
                    alert("Error al cargar el archivo JSON.");
                    console.error('Error al analizar el JSON:', error);
                } finally {
                    // Volver a habilitar el botón de carga después de procesar el archivo
                    uploadButton.disabled = false;
                }
            };
    
            reader.readAsText(file);
        } else {
            alert("Por favor, selecciona un archivo JSON válido.");
        }
    }
    

    function processJson() {
        if (!jsonObject) {
            alert("No hay un archivo JSON cargado para procesar.");
            return;
        }

        console.log('Tipo de jsonObject:', typeof jsonObject);
        console.log('Es un array?:', Array.isArray(jsonObject));

        if (Array.isArray(jsonObject)) {
            // Limpiar el array de hostIds
            hostIds = [];

            // Obtener los IDs de los hosts
            let hostPromises = jsonObject.map(item => {
                if (item && item.Host) {
                    let hostName = item.Host;
                    console.log('Nombre del host:', hostName);
                    return getHostAndTemplates(hostName);
                } else {
                    console.error('El objeto del JSON no contiene la clave "Host".');
                    return Promise.resolve(); // Para continuar con el siguiente ítem
                }
            });

            // Esperar a que se obtengan todos los hostIds antes de procesar
            Promise.all(hostPromises).then(() => {
                if (typeof updateHostGroupsAndStatus === 'function') {
                    let updatePromises = hostIds.map(hostId => {
                        return updateHostGroupsAndStatus(hostId)
                            .then(() => console.log(`Host ${hostId} actualizado exitosamente.`))
                            .catch(error => console.error(`Error actualizando el host ${hostId}:`, error));
                    });

                    // Notificar cuando todos los hosts hayan sido actualizados
                    Promise.all(updatePromises)
                        .then(() => {
                            alert('Todas las actualizaciones de hosts se han completado.');

                            // Recargar la página después de 10 segundos
                            setTimeout(() => {
                                location.reload(); // Recargar la página
                            }, 10000); // 10,000 ms = 10 segundos

                        })
                        .catch(error => {
                            alert('Se produjo un error durante la actualización de los hosts: ' + error.message);
                            console.error('Error durante la actualización de hosts:', error);
                        });

                } else {
                    console.error("La función updateHostGroupsAndStatus no está disponible.");
                }
            }).catch(error => {
                console.error('Error al obtener los IDs de los hosts:', error);
            });

        } else {
            console.error('El JSON no es una lista válida.');
        }
    }

    function getHostAndTemplates(hostName) {
        return obtainHostIdFromName(hostName)
            .then(hostId => {
                if (hostId) {
                    hostIds.push(hostId);  // Añade el hostId al array global
                }
            })
            .catch(error => console.error('Error al obtener el hostId:', error));
    }

    async function obtainHostIdFromName(hostName) {
        try {
            let response = await fetch('http://10.144.2.194/zabbix/api_jsonrpc.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "host.get",
                    params: {
                        filter: {
                            host: [hostName]
                        },
                        output: ["hostid"]
                    },
                    auth: "68f08dd04965819aebf23bc2659a239f", // Reemplaza con tu token de autenticación
                    id: 1
                })
            });

            let data = await response.json();
            if (data.result.length > 0) {
                return data.result[0].hostid; // Devuelve el ID del primer host encontrado
            } else {
                console.error("No se encontró el host con nombre: " + hostName);
                return null;
            }
        } catch (error) {
            console.error("Error al obtener el host ID:", error);
            return null;
        }
    }

    
});
