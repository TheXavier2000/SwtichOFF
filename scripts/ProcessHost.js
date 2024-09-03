// assignToGroup.js
$(document).ready(function() {
    // Definir la función para obtener grupos, eliminarlos, agregar al grupo 'Networking_Disable' y habilitar el host
    function updateHostGroupsAndStatus(hostId) {
        return new Promise((resolve, reject) => {
            // Obtener todos los grupos asignados al host
            fetch('http://10.144.2.194/zabbix/api_jsonrpc.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "host.get",
                    params: {
                        output: ["groups"],
                        hostids: hostId
                    },
                    auth: "68f08dd04965819aebf23bc2659a239f",
                    id: 3
                })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.result || data.result.length === 0) {
                    throw new Error("No se encontró el host con ID '" + hostId + "'.");
                }

                // Eliminar todos los grupos del host
                return fetch('http://10.144.2.194/zabbix/api_jsonrpc.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "host.massupdate",
                        params: {
                            hosts: [{
                                hostid: hostId,
                                groups: [] // Eliminar todos los grupos
                            }]
                        },
                        auth: "68f08dd04965819aebf23bc2659a239f",
                        id: 4
                    })
                });
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error("Error al eliminar los grupos del host '" + hostId + "': " + data.error.message);
                }

                // Eliminar todos los templates asignados al host
                return fetch('http://10.144.2.194/zabbix/api_jsonrpc.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "host.update",
                        params: {
                            hostid: hostId,
                            templates: []  // Eliminar todos los templates del host
                        },
                        auth: "68f08dd04965819aebf23bc2659a239f",
                        id: 6 // Puedes usar un ID diferente para esta solicitud
                    })
                });
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error("Error al eliminar los templates del host '" + hostId + "': " + data.error.message);
                }

                // Ahora, agregar el host al grupo 'Networking_Disable' (groupid: 84) y habilitar el host
                return fetch('http://10.144.2.194/zabbix/api_jsonrpc.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "host.update",
                        params: {
                            hostid: hostId,
                            groups: [{
                                groupid: "84"  // ID del grupo "Networking_Disable"
                            }],
                            status: 1  // deshabilitar el host
                        },
                        auth: "68f08dd04965819aebf23bc2659a239f",
                        id: 5
                    })
                });
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error("Error al actualizar el host '" + hostId + "': " + data.error.message);
                }
                alert("Host actualizado. Habilitado y asignado al grupo 'Networking_Disable': " + hostId);
                resolve(); // Indicar que la operación se completó exitosamente
            })
            .catch(error => {
                console.error('Error al actualizar el host:', error);
                alert('Error al actualizar el host: ' + error.message);
                reject(error); // Indicar que hubo un error
            });
        });
    }

    // Bucle para actualizar cada host
    let updatePromises = hostIds.map(hostId => {
        return updateHostGroupsAndStatus(hostId)
            .then(() => console.log(`Host ${hostId} actualizado exitosamente.`))
            .catch(error => console.error(`Error actualizando el host ${hostId}:`, error));
    });

    // Notificar cuando todos los hosts hayan sido actualizados
    Promise.all(updatePromises)
        .then(() => alert('Todas las actualizaciones de hosts se han completado.'))
        .catch(error => alert('Se produjo un error durante la actualización de los hosts: ' + error.message));

    // Exportar la función para que esté disponible globalmente (si es necesario)
    window.updateHostGroupsAndStatus = updateHostGroupsAndStatus;
});
