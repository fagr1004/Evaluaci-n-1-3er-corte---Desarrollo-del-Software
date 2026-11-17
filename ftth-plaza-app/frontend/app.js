document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Navegación entre Pestañas ---
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remover la clase active de todos los enlaces y ocultar secciones
            navLinks.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });

            // Activar el enlace presionado
            link.classList.add('active');

            // Mostrar la sección correspondiente
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
            }
        });
    });

    // --- Lógica del Formulario de Auditoría NAP ---
    const auditForm = document.getElementById('nap-audit-form');

    if (auditForm) {
        auditForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const napCode = document.getElementById('nap-code').value.trim();
            const sector = document.getElementById('sector').value.trim();
            const coordinates = document.getElementById('coordinates').value.trim();
            const splitterCapacity = document.getElementById('splitter-capacity').value;
            const opticalPower = parseFloat(document.getElementById('optical-power').value);
            const status = document.getElementById('status').value;
            const observations = document.getElementById('observations').value.trim();

            if (!napCode || !sector) {
                alert('Por favor, complete los campos obligatorios (Código de Caja NAP y Sector).');
                return;
            }

            if (!isNaN(opticalPower)) {
                if (opticalPower > -10 || opticalPower < -30) {
                    console.warn('Advertencia: El nivel de potencia óptica ingresado está fuera del rango operativo estándar.');
                }
            }

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

            console.log('Datos listos para enviar al backend (Python):', JSON.stringify(auditData, null, 2));
            alert(`¡Auditoría de la caja ${napCode} guardada y enviada con éxito para el Municipio Plaza!`);
            auditForm.reset();
        });
    }
});