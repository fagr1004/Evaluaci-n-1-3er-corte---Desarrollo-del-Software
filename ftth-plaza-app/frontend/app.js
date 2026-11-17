document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DATOS DE PRUEBA (Mock Data - Simulando la respuesta del Backend en Python) ---
    const cajasNapDatabase = {
        "NAP-TRAP-01": {
            codigo: "NAP-TRAP-01",
            sector: "Trapichito",
            puertos: [
                { id: 1, estado: "OPTIMO", abonado: "Carlos Pérez", potencia: -19.5 },
                { id: 2, estado: "OPTIMO", abonado: "María Rodríguez", potencia: -20.1 },
                { id: 3, estado: "ATENUADO", abonado: "Juan Gómez", potencia: -27.8 },
                { id: 4, estado: "LIBRE", abonado: "Sin Asignar", potencia: 0.0 },
                { id: 5, estado: "OPTIMO", abonado: "Ana Silva", potencia: -18.9 },
                { id: 6, estado: "OPTIMO", abonado: "Pedro Torres", potencia: -21.2 },
                { id: 7, estado: "DANADO", abonado: "Fallo Físico", potencia: 0.0 },
                { id: 8, estado: "OPTIMO", abonado: "Luisa Morales", potencia: -19.8 }
            ]
        },
        "NAP-CENTRO-01": {
            codigo: "NAP-CENTRO-01",
            sector: "Centro de Guarenas",
            puertos: [
                { id: 1, estado: "OPTIMO", abonado: "Comercio Local A", potencia: -18.2 },
                { id: 2, estado: "LIBRE", abonado: "Sin Asignar", potencia: 0.0 },
                { id: 3, estado: "OPTIMO", abonado: "Oficina 3B", potencia: -19.0 },
                { id: 4, estado: "ATENUADO", abonado: "Residencia Sur", potencia: -28.5 },
                { id: 5, estado: "LIBRE", abonado: "Sin Asignar", potencia: 0.0 },
                { id: 6, estado: "LIBRE", abonado: "Sin Asignar", potencia: 0.0 },
                { id: 7, estado: "OPTIMO", abonado: "Familia Díaz", potencia: -20.4 },
                { id: 8, estado: "LIBRE", abonado: "Sin Asignar", potencia: 0.0 }
            ]
        }
    };

    // --- 2. ELEMENTOS DEL DOM ---
    const selectNapUI = document.getElementById('select-nap-ui');
    const splitterContainer = document.querySelector('.splitter-ports-row');
    const auditForm = document.getElementById('audit-form');
    const navButtons = document.querySelectorAll('.icon-nav .icon-btn');

    // --- 3. FUNCIONES DE RENDERIZADO (Actualizar la interfaz visual) ---
    function renderizarPuertosNAP(codigoNap) {
        const napData = cajasNapDatabase[codigoNap];
        if (!napData || !splitterContainer) return;

        // Limpiar el contenedor actual de puertos
        splitterContainer.innerHTML = '';

        // Recorrer los puertos del splitter (1 al 8)
        napData.puertos.forEach(puerto => {
            const portDiv = document.createElement('div');
            portDiv.classList.add('port-pill');

            // Asignar bordes o estilos según el estado óptico de la fibra
            if (puerto.estado === 'OPTIMO') {
                portDiv.style.borderColor = 'var(--accent-green)';
            } else if (puerto.estado === 'ATENUADO') {
                portDiv.style.borderColor = 'var(--accent-orange)';
            } else if (puerto.estado === 'DANADO') {
                portDiv.classList.add('red-border'); // Aplica el rojo principal brillante con resplandor
            } else {
                portDiv.style.borderColor = 'var(--border-card)';
            }

            // Inyectar estructura interna de la píldora del puerto
            portDiv.innerHTML = `
                <span>P${puerto.id.toString().padStart(2, '0')}</span>
                <small>${puerto.estado === 'LIBRE' ? 'Libre' : puerto.potencia + ' dBm'}</small>
            `;

            // Evento al hacer clic en un puerto para mostrar detalles rápidos tipo alerta
            portDiv.addEventListener('click', () => {
                alert(`Puerto: P${puerto.id}\nEstado: ${puerto.estado}\nAbonado: ${puerto.abonado}\nPotencia: ${puerto.potencia} dBm`);
            });

            splitterContainer.appendChild(portDiv);
        });
    }

    // --- 4. EVENT LISTENERS Y CONTROL DE INTERACTIVIDAD ---

    // Inicializar el selector de cajas NAP si existe en el HTML
    if (selectNapUI) {
        renderizarPuertosNAP(selectNapUI.value || "NAP-TRAP-01");

        selectNapUI.addEventListener('change', (e) => {
            renderizarPuertosNAP(e.target.value);
        });
    }

    // Manejo de navegación fluida entre los botones del menú lateral
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetSection = btn.getAttribute('href');
            console.log("Navegando a la sección:", targetSection);
        });
    });

    // --- 5. CAPTURA Y ENVÍO DEL FORMULARIO DE AUDITORÍA ---
    if (auditForm) {
        auditForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const codigoNap = document.getElementById('input-nap-code').value;
            const numPuerto = document.getElementById('input-port-num').value;
            const potencia = document.getElementById('input-power').value;
            const estadoFisico = document.getElementById('input-status').value;

            // Objeto JSON listo para ser enviado mediante Fetch API hacia el backend de Python
            const payloadAuditoria = {
                nap_code: codigoNap,
                port_number: parseInt(numPuerto),
                optical_power_dbm: parseFloat(potencia),
                physical_status: estadoFisico,
                timestamp: new Date().toISOString()
            };

            console.log("Datos de auditoría listos para enviar al backend en Python:", payloadAuditoria);

            // Notificación visual de éxito para el usuario
            alert(`¡Auditoría registrada con éxito para la caja ${codigoNap}, Puerto #${numPuerto}!`);
            auditForm.reset();
        });
    }

});