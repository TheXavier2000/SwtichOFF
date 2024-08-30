$(document).ready(async function() {
    try {
        // Cargar fileHandler.js para procesar el archivo JSON
        await $.getScript("../scripts/fileHandler.js");
        console.log("fileHandler.js cargado correctamente.");

        // Escuchar el evento jsonObjectReady para saber cuándo jsonObject está listo
        document.addEventListener('jsonObjectReady', async () => {
            console.log('jsonObjectReady evento recibido');
            
            // Verificar si jsonObject está disponible y es un array
            if (typeof jsonObject !== 'undefined' && Array.isArray(jsonObject)) {

                // Cargar scripts necesarios en orden

                await $.getScript("../scripts/removeTemplates.js");
                console.log("removeTemplates.js cargado correctamente.");

                await $.getScript("../scripts/ProcessHost.js");
                console.log("ProcessHost.js cargado correctamente.");

                // Procesar cada host
                for (const item of jsonObject) {
                    let hostName = item.Host;

                    try {
                        let hostId = await getHostAndTemplates(hostName);
                        await removeTemplates(hostId);
                        await ProcessHost(hostId, "Networking_disable");
                        console.log(`Host ${hostName} procesado completamente.`);
                    } catch (error) {
                        console.error('Error en el procesamiento del host:', error);
                    }
                }
            } else {
                console.error("jsonObject no está definido o no es un array.");
            }
        });

    } catch (error) {
        console.error('Error al cargar scripts:', error);
    }
});
