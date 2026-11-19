const API_URL = 'https://evaluaci-n-1-3er-corte-desarrollo-del.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Navegación entre Pestañas ---
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            viewSections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
            }
        });
    });

    // --- Cargar historial guardado al iniciar ---
    renderAudits();

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

            const auditData = {
                codigo_nap: napCode,
                sector: sector,
                coordenadas: coordinates,
                capacidad_splitter: `1:${splitterCapacity}`,
                potencia_optica_dbm: isNaN(opticalPower) ? null : opticalPower,
                estado_operativo: status,
                observations: observations,
                fecha_auditoria: new Date().toLocaleString()
            };

            // Guardar localmente en el navegador como respaldo
            let audits = JSON.parse(localStorage.getItem('nap_audits')) || [];
            audits.unshift(auditData);
            localStorage.setItem('nap_audits', JSON.stringify(audits));

            // Payload con los nombres exactos que espera /api/auditorias
            const payload = {
                nap_id: parseInt(napCode, 10) || 1,
                tecnico_id: 1,
                potencia_medida_dbm: isNaN(opticalPower) ? 0 : opticalPower,
                sellado_hermetico_ok: status === 'Operativo',
                etiquetado_fibras_ok: true,
                reserva_cable_ok: true,
                observaciones: observations || `Sector: ${sector} | Coordenadas: ${coordinates} | Splitter: 1:${splitterCapacity}`
            };

            fetch(`${API_URL}/api/auditorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log('Guardado en backend:', data);
                alert(`¡Auditoría de la caja ${napCode} guardada con éxito!`);
            })
            .catch(err => {
                console.error('Error al conectar con el backend:', err);
                alert(`Auditoría de ${napCode} guardada localmente (no se pudo enviar al servidor).`);
            })
            .finally(() => {
                auditForm.reset();
                renderAudits();
            });
        });
    }
});

// Función para mostrar las auditorías guardadas en la sección de Reportes
function renderAudits() {
    let audits = JSON.parse(localStorage.getItem('nap_audits')) || [];
    const reportsView = document.getElementById('reports-view');

    if (reportsView) {
        let htmlContent = `
            <h2>Reportes Técnicos y Auditorías Guardadas</h2>
            <p style="color: #64748b; margin-bottom: 15px;">Listado de cajas NAP auditadas localmente en este navegador:</p>
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; max-height: 300px; overflow-y: auto;">
        `;

        if (audits.length === 0) {
            htmlContent += `<p style="color: #94a3b8;">No hay auditorías registradas todavía.</p>`;
        } else {
            htmlContent += `<ul style="list-style: none; padding: 0;">`;
            audits.forEach(audit => {
                htmlContent += `
                    <li style="border-bottom: 1px solid #f1f5f9; padding: 10px 0;">
                        <strong>${audit.codigo_nap}</strong> - ${audit.sector}
                        <span style="font-size: 0.8rem; color: #64748b; float: right;">${audit.fecha_auditoria}</span><br>
                        <small>Potencia: ${audit.potencia_optica_dbm !== null ? audit.potencia_optica_dbm + ' dBm' : 'N/A'} | Estado: <em>${audit.estado_operativo}</em></small>
                    </li>
                `;
            });
            htmlContent += `</ul>`;
        }
        htmlContent += `</div>`;

        const container = reportsView.querySelector('.audit-section');
        if (container) {
            container.innerHTML = htmlContent;
        }
    }
}