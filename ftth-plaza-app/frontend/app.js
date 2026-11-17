document.addEventListener('DOMContentLoaded', () => {
    const auditForm = document.getElementById('nap-audit-form');

    if (auditForm) {
        auditForm.addEventListener('submit', function(event) {
            // Evitamos que la página se recargue por defecto
            event.preventDefault();

            // Recolectamos los valores del formulario
            const napCode = document.getElementById('nap-code').value.trim();
            const sector = document.getElementById('sector').value.trim();
            const coordinates = document.getElementById('coordinates').value.trim();
            const splitterCapacity = document.getElementById('splitter-capacity').value;
            const opticalPower = parseFloat(document.getElementById('optical-power').value);
            const status = document.getElementById('status').value;
            const observations = document.getElementById('observations').value.trim();

            // Validaciones básicas de lógica técnica FTTH-GPON
            if (!napCode || !sector) {
                alert('Por favor, complete los campos obligatorios (Código de Caja NAP y Sector).');
                return;
            }

            // Alerta lógica opcional sobre la potencia óptica típica en GPON (ej. entre -10 dBm y -28 dBm)
            if (!isNaN(opticalPower)) {
                if (opticalPower > -10 || opticalPower < -30) {
                    console.warn('Advertencia: El nivel de potencia óptica ingresado está fuera del rango operativo estándar.');
                }
            }

            // Creamos el objeto de datos que tu compañero recibirá en el backend de Python
            const auditData = {
                codigo_nap: napCode,
                sector: sector,
                coordenadas: coordinates,
                capacidad_splitter: `1:${splitterCapacity}`,
                potencia_optica_dbm: isNaN(opticalPower) ? null : opticalPower,
                estado_operativo: status,
                observaciones: observations,
                fecha_auditoria: new Date().toISOString()
            };

            // Simulación de envío exitoso (Aquí iría la petición fetch() hacia tu API en Python)
            console.log('Datos listos para enviar al backend (Python):', JSON.stringify(auditData, null, 2));

            // Feedback visual para el usuario
            alert(`¡Auditoría de la caja ${napCode} guardada y enviada con éxito para el Municipio Plaza!`);
            
            // Limpiar formulario opcionalmente
            auditForm.reset();
        });
    }
});
