// fileHandler.js
var jsonObject = null;  // Declaración global
var hostIds = [];  // Definición global para almacenar los IDs de los hosts

document.addEventListener('DOMContentLoaded', () => {
    let dropArea = document.getElementById('drop-area');
    let fileElem = document.getElementById('fileElem');
    let statusMessage = document.getElementById('status-message');

    if (dropArea) {
        dropArea.addEventListener('click', () => {
            if (fileElem) {
                fileElem.click();
            } else {
                console.error('Elemento de entrada de archivo no encontrado.');
            }
        });
    } else {
        console.error('Área de arrastrar y soltar no encontrada.');
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

            reader.onload = function(event) {
                try {
                    let jsonString = event.target.result;
                    jsonObject = JSON.parse(jsonString); // Almacenar JSON en variable global

                    statusMessage.textContent = "Archivo JSON procesado correctamente.";
                    statusMessage.style.color = "green";
                    console.log('JSON cargado:', jsonObject);
                    document.dispatchEvent(new Event('jsonObjectReady')); // Disparar el evento

                    // Llamar a la función de procesamiento después de cargar el JSON
                    processJson();
                } catch (error) {
                    statusMessage.textContent = "Error al procesar el archivo JSON.";
                    statusMessage.style.color = "red";
                    console.error('Error al analizar el JSON:', error);
                }
            };

            reader.readAsText(file);
        } else {
            statusMessage.textContent = "Por favor, selecciona un archivo JSON válido.";
            statusMessage.style.color = "red";
        }
    }

    function processJson() {
        console.log('Tipo de jsonObject:', typeof jsonObject); // Verifica el tipo
        console.log('Es un array?:', Array.isArray(jsonObject)); // Verifica si es un array
    
        if (jsonObject && Array.isArray(jsonObject)) {
            jsonObject.forEach(item => {
                if (item && item.Host) {
                    let hostName = item.Host;
                    console.log('Nombre del host:', hostName);
                    getHostAndTemplates(hostName);
                } else {
                    console.error('El objeto del JSON no contiene la clave "Host".');
                }
            });

            if (typeof updateHostGroupsAndStatus === 'function') {
                hostIds.forEach(hostId => {
                    updateHostGroupsAndStatus(hostId)
                        .then(() => console.log(`Host ${hostId} actualizado exitosamente.`))
                        .catch(error => console.error(`Error actualizando el host ${hostId}:`, error));
                });
            } else {
                console.error("La función updateHostGroupsAndStatus no está disponible.");
            }

        } else {
            console.error('El JSON no es una lista válida.');
        }
    }

    function getHostAndTemplates(hostName) {
        obtainHostIdFromName(hostName)
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
