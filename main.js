document.addEventListener('DOMContentLoaded', function() {
    // --- Configuración inicial ---
    const params = new URLSearchParams(window.location.search);
    let codigoEmpresa = params.get('codigo_empresa') || '001';
    const empresaInput = document.querySelector('input[name="codigo_empresa"]');
    if (empresaInput) empresaInput.value = codigoEmpresa;

    const clienteInput = document.getElementById('codigo_cliente');
    if (clienteInput) clienteInput.focus();

    let erpToken = null;

    // --- Obtener token del ERP ---
    async function obtenerTokenERP() {
        // Ahora usamos el proxy local del server.js
        const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'grant_type=client_credentials&client_id=BARCOS&client_secret=PJp4sliC0DIvle'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error token ERP:', errorText);
            throw new Error('No se pudo obtener el token');
        }

        const data = await response.json();
        console.log('✅ Token recibido:', data);

        // Mostrar token en el campo "Nombre del Barco"
        const barcoInput = document.getElementById('nombre_barco');
        if (barcoInput) barcoInput.value = data.access_token || '';

        return data.access_token;
    }

    // --- Cargar clientes ---
    async function cargarClientesConToken(token) {
        const empresa = empresaInput ? empresaInput.value : '001';

        fetch(`/api/clientes?EMPRESA=${empresa}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: 'BARCOS',
                client_secret: 'PJp4sliC0DIvle'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Clientes recibidos:', data);

            const datalist = document.getElementById('clientesList');
            if (Array.isArray(data) && data.length > 0) {
                datalist.innerHTML = '';
                window._clientesMap = new Map();
                window._clientesArray = data;
                data.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente.codigo;
                    option.label = cliente.nombre;
                    datalist.appendChild(option);
                    window._clientesMap.set(cliente.codigo, cliente.nombre);
                });
                mostrarModalClientes();
            } else {
                mostrarErrorClientes();
            }
        })
        .catch(err => {
            console.error('❌ Error al cargar clientes:', err);
            mostrarErrorClientes();
        });
    }

    // --- Mostrar error ---
    function mostrarErrorClientes() {
        let oldModal = document.getElementById('errorClientesModal');
        if (oldModal) oldModal.remove();
        let modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'errorClientesModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Error</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <p>No carga clientes</p>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        setTimeout(() => bootstrap.Modal.getOrCreateInstance(modal).show(), 100);
    }

    // --- Mostrar modal clientes ---
    function mostrarModalClientes() {
        let oldModal = document.getElementById('clientesModal');
        if (oldModal) oldModal.remove();

        let modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'clientesModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Seleccionar Cliente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-hover" id="tablaClientes">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Barco</th>
                                        <th>IMO</th>
                                        <th>Puerto</th>
                                        <th>Teléfono</th>
                                        <th>Email</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const tbody = modal.querySelector('tbody');
        tbody.innerHTML = '';
        if (window._clientesArray && window._clientesArray.length > 0) {
            window._clientesArray.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cliente.codigo || ''}</td>
                    <td>${cliente.nombre || ''}</td>
                    <td>${cliente.barco || ''}</td>
                    <td>${cliente.imo || ''}</td>
                    <td>${cliente.puerto || ''}</td>
                    <td>${cliente.telefono || ''}</td>
                    <td>${cliente.email || ''}</td>
                    <td><button type="button" class="btn btn-primary btn-sm seleccionar-cliente">Seleccionar</button></td>
                `;
                tr.querySelector('.seleccionar-cliente').addEventListener('click', function() {
                    rellenarFormularioCliente(cliente);
                    bootstrap.Modal.getOrCreateInstance(modal).hide();
                });
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay clientes disponibles</td></tr>';
        }

        setTimeout(() => bootstrap.Modal.getOrCreateInstance(modal).show(), 100);
    }

    // --- Rellenar formulario cliente ---
    function rellenarFormularioCliente(cliente) {
        document.getElementById('codigo_cliente').value = cliente.codigo || '';
        const nombreInput = document.querySelector('input[maxlength="40"]');
        if (nombreInput) nombreInput.value = cliente.nombre || '';
        const barcoInput = document.getElementById('nombre_barco');
        if (barcoInput) barcoInput.value = cliente.barco || '';
        const imoInput = document.querySelector('input[maxlength="30"]');
        if (imoInput) imoInput.value = cliente.imo || '';
        const puertoInput = document.querySelectorAll('input[maxlength="20"]')[0];
        if (puertoInput) puertoInput.value = cliente.puerto || '';
        const telefonoInput = document.querySelector('input[type="tel"]');
        if (telefonoInput) telefonoInput.value = cliente.telefono || '';
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) emailInput.value = cliente.email || '';
    }

    // --- Cambio código cliente ---
    const nombreClienteInput = document.querySelector('input[maxlength="40"]');
    if (clienteInput && nombreClienteInput) {
        clienteInput.addEventListener('change', function() {
            if (window._clientesMap) {
                nombreClienteInput.value = window._clientesMap.get(this.value) || '';
            }
        });
    }

    // --- Focus en código cliente = obtener token + cargar clientes ---
    if (clienteInput) {
        clienteInput.addEventListener('focus', async function() {
            document.body.style.cursor = 'wait';
            try {
                erpToken = await obtenerTokenERP();
                await cargarClientesConToken(erpToken);
            } catch (e) {
                console.error('Error obteniendo token ERP:', e);
                mostrarErrorClientes();
            } finally {
                document.body.style.cursor = '';
            }
        });
    }

    // --- Funciones auxiliares globales ---
    window.addProductRow = function() {
        const tbody = document.querySelector('#productosTable tbody');
        const rowCount = tbody.children.length + 1;
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="text" class="form-control" maxlength="30"></td>
            <td><input type="text" class="form-control" maxlength="100"></td>
            <td><input type="number" class="form-control"></td>
            <td><input type="number" class="form-control"></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('tr').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </td>`;
        tbody.appendChild(newRow);
    }

    window.selectPuerto = function(puerto) {
        document.querySelector('input[readonly]').value = puerto;
        bootstrap.Modal.getInstance(document.getElementById('puertosModal')).hide();
    }

    // --- Validación formulario ---
    document.getElementById('suministroForm').addEventListener('submit', function(event) {
        if (!this.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.classList.add('was-validated');
    }, false);
});