document.addEventListener('DOMContentLoaded', () => {
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

    const selectNapUI = document.getElementById('select-nap-ui');
    const splitterContainer = document.querySelector('.splitter-ports-row');
    const navButtons = document.querySelectorAll('.icon-nav .icon-btn');

    function renderizarPuertosNAP(codigoNap) {
        const napData = cajasNapDatabase[codigoNap];
        if (!napData || !splitterContainer) return;

        splitterContainer.innerHTML = '';

        napData.puertos.forEach(puerto => {
            const portDiv = document.createElement('div');
            portDiv.classList.add('port-pill');

            if (puerto.estado === 'OPTIMO') {
                portDiv.style.borderColor = 'var(--accent-red)';
                portDiv.style.backgroundColor = 'var(--accent-red-glow)';
            } else if (puerto.estado === 'ATENUADO') {
                portDiv.style.borderColor = 'var(--accent-orange)';
                portDiv.style.backgroundColor = 'var(--accent-orange-glow)';
            } else if (puerto.estado === 'DANADO') {
                portDiv.classList.add('red-border');
            } else {
                portDiv.style.borderColor = 'var(--border-card)';
            }

            portDiv.innerHTML = `
                <span>P${puerto.id.toString().padStart(2, '0')}</span>
                <small>${puerto.estado === 'LIBRE' ? 'Libre' : puerto.potencia + ' dBm'}</small>
            `;

            portDiv.addEventListener('click', () => {
                alert(`Puerto: P${puerto.id}\nEstado: ${puerto.estado}\nAbonado: ${puerto.abonado}\nPotencia: ${puerto.potencia} dBm`);
            });

            splitterContainer.appendChild(portDiv);
        });
    }

    if (selectNapUI) {
        renderizarPuertosNAP(selectNapUI.value || "NAP-TRAP-01");
        selectNapUI.addEventListener('change', (e) => {
            renderizarPuertosNAP(e.target.value);
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});
