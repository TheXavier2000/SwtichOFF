$(document).ready(function() {
    const referenciaTemplatesUrl = '../json/templates.json'; // Ruta al JSON de referencia

    function fetchTemplatesReferencia() {
        return fetch(referenciaTemplatesUrl)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error("No se encontraron templates en el JSON de referencia.");
                }
                return data;
            });
    }

    function getTemplatesAndHosts() {
        return fetch('http://10.144.2.194/zabbix/api_jsonrpc.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "template.get",
                params: {
                    output: ["templateid", "name"],
                    selectHosts: ["hostid", "name"]
                },
                auth: "68f08dd04965819aebf23bc2659a239f",
                id: 2
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.result || data.result.length === 0) {
                throw new Error("No se encontraron templates.");
            }

            return data.result;
        });
    }

    function removeTemplates(hostName) {
        return new Promise((resolve, reject) => {
            getTemplatesAndHosts()
            .then(templatesData => {
                const templatesReferencia = fetchTemplatesReferencia();

                return Promise.all([templatesData, templatesReferencia]).then(([templatesData, templatesReferencia]) => {
                    const idsReferencia = new Set(templatesReferencia.map(template => template.templateid));

                    // Filtrar templates que tienen el host y están en la referencia
                    const templatesAEliminar = templatesData.filter(template =>
                        idsReferencia.has(template.templateid) &&
                        template.hosts.some(host => host.name === hostName)
                    );

                    if (templatesAEliminar.length === 0) {
                        console.log("No hay templates para eliminar.");
                        resolve(); // No hay templates para eliminar
                        return;
                    }

                    // Obtener el host ID del primer template encontrado
                    const hostId = templatesAEliminar[0].hosts.find(host => host.name === hostName).hostid;
                    console.log("Host ID obtenido:", hostId);

                    // Realizar la solicitud para actualizar el host y eliminar los templates
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
                            id: 5
                        })
                    });
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error en la respuesta de la solicitud de eliminación.");
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error("Error al eliminar los templates: " + data.error.message);
                }
                console.log("Templates eliminados para el host:", hostName);
                resolve();
            })
            .catch(error => {
                console.error('Error al eliminar templates:', error);
                reject(error);
            });
        });
    }

    window.removeTemplates = removeTemplates;
});
