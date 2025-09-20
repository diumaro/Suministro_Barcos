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
        console.log('🔄 Obteniendo token...');
        
        try {
            const response = await fetch('/api/token', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: 'grant_type=client_credentials&client_id=BARCOS&client_secret=PJp4sliC0DIvle'
            });

            console.log('📡 Respuesta token status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error token ERP:', errorText);
                throw new Error(`Error HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Token recibido:', data);

            // Mostrar token en el campo "Nombre del Barco" (para debug)
            const barcoInput = document.getElementById('nombre_barco');
            if (barcoInput) barcoInput.value = data.access_token ? 'Token obtenido ✓' : 'Error token';

            return data.access_token;
        } catch (error) {
            console.error('❌ Error obteniendo token:', error);
            throw error;
        }
    }

    // --- Cargar clientes ---
    async function cargarClientesConToken(token) {
        console.log('🔄 Cargando clientes con token...');
        
        const empresa = empresaInput ? empresaInput.value : '001';

        try {
            const response = await fetch(`/api/clientes?EMPRESA=${empresa}`, {
                method: 'GET', // Cambiado de POST a GET ya que es una consulta
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('📡 Respuesta clientes status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error HTTP clientes:', errorText);
                throw new Error(`Error HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Clientes recibidos:', data);

            // Procesar clientes
            if (Array.isArray(data) && data.length > 0) {
                procesarClientes(data);
                mostrarModalClientes();
            } else if (data && typeof data === 'object') {
                // Si la respuesta es un objeto, intentar extraer el array
                const clientesArray = data.clientes || data.data || data.results || [data];
                if (clientesArray.length > 0) {
                    procesarClientes(clientesArray);
                    mostrarModalClientes();
                } else {
                    console.warn('⚠️ No se encontraron clientes en la respuesta');
                    mostrarErrorClientes('No se encontraron clientes');
                }
            } else {
                console.warn('⚠️ Respuesta de clientes vacía o inválida');
                mostrarErrorClientes('No se encontraron clientes');
            }

        } catch (error) {
            console.error('❌ Error al cargar clientes:', error);
            mostrarErrorClientes(`Error al cargar clientes: ${error.message}`);
        }
    }

    // --- Procesar clientes ---
    function procesarClientes(clientes) {
        const datalist = document.getElementById('clientesList');
        if (datalist) {
            datalist.innerHTML = '';
            window._clientesMap = new Map();
            window._clientesArray = clientes;
            
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.codigo || cliente.id || cliente.codigoCliente || '';
                option.label = cliente.nombre || cliente.razonSocial || cliente.denominacion || '';
                datalist.appendChild(option);
                window._clientesMap.set(option.value, option.label);
            });
        }
    }

    // --- Mostrar error ---
    function mostrarErrorClientes(mensaje = 'No se pudieron cargar los clientes') {
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
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p class="mb-0">${mensaje}</p>
                        </div>
                        <small class="text-muted">Revisa la consola del navegador para más detalles</small>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="location.reload()">Reintentar</button>
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
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-ship"></i> 
                            Seleccionar Cliente (${window._clientesArray ? window._clientesArray.length : 0} encontrados)
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-hover table-striped" id="tablaClientes">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Código</th>
                                        <th>Nombre</th>
                                        <th>Barco</th>
                                        <th>IMO</th>
                                        <th>Puerto</th>
                                        <th>Teléfono</th>
                                        <th>Email</th>
                                        <th>Acción</th>
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
            window._clientesArray.forEach((cliente, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${cliente.codigo || cliente.id || ''}</strong></td>
                    <td>${cliente.nombre || cliente.razonSocial || ''}</td>
                    <td>${cliente.barco || cliente.nombreBarco || ''}</td>
                    <td>${cliente.imo || cliente.imoNumber || ''}</td>
                    <td>${cliente.puerto || cliente.puertoBase || ''}</td>
                    <td>${cliente.telefono || cliente.tel || ''}</td>
                    <td>${cliente.email || cliente.correo || ''}</td>
                    <td>
                        <button type="button" class="btn btn-primary btn-sm seleccionar-cliente">
                            <i class="fas fa-check"></i> Seleccionar
                        </button>
                    </td>
                `;
                
                tr.querySelector('.seleccionar-cliente').addEventListener('click', function() {
                    rellenarFormularioCliente(cliente);
                    bootstrap.Modal.getOrCreateInstance(modal).hide();
                });
                
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay clientes disponibles</td></tr>';
        }

        setTimeout(() => bootstrap.Modal.getOrCreateInstance(modal).show(), 100);
    }

    // --- Rellenar formulario cliente ---
    function rellenarFormularioCliente(cliente) {
        console.log('📝 Rellenando formulario con:', cliente);
        
        // Código cliente
        const codigoInput = document.getElementById('codigo_cliente');
        if (codigoInput) codigoInput.value = cliente.codigo || cliente.id || '';
        
        // Nombre cliente
        const nombreInput = document.querySelector('input[maxlength="40"]');
        if (nombreInput) nombreInput.value = cliente.nombre || cliente.razonSocial || '';
        
        // Nombre del barco
        const barcoInput = document.getElementById('nombre_barco');
        if (barcoInput) barcoInput.value = cliente.barco || cliente.nombreBarco || '';
        
        // IMO
        const imoInput = document.querySelector('input[maxlength="30"]');
        if (imoInput) imoInput.value = cliente.imo || cliente.imoNumber || '';
        
        // Puerto suministro
        const puertoInputs = document.querySelectorAll('input[maxlength="20"]');
        if (puertoInputs[0]) puertoInputs[0].value = cliente.puerto || cliente.puertoBase || '';
        
        // Teléfono
        const telefonoInput = document.querySelector('input[type="tel"]');
        if (telefonoInput) telefonoInput.value = cliente.telefono || cliente.tel || '';
        
        // Email
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) emailInput.value = cliente.email || cliente.correo || '';
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
            // Evitar múltiples llamadas simultáneas
            if (this.dataset.loading === 'true') return;
            this.dataset.loading = 'true';
            
            document.body.style.cursor = 'wait';
            console.log('🎯 Iniciando carga de clientes...');
            
            try {
                // Obtener token
                erpToken = await obtenerTokenERP();
                console.log('✅ Token obtenido, cargando clientes...');
                
                // Cargar clientes
                await cargarClientesConToken(erpToken);
                
            } catch (error) {
                console.error('❌ Error en el flujo completo:', error);
                mostrarErrorClientes(`Error: ${error.message}`);
            } finally {
                document.body.style.cursor = '';
                this.dataset.loading = 'false';
            }
        });
    }

    // --- Test de conectividad ---
    async function testConectividad() {
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            console.log('🔧 Test conectividad:', data);
        } catch (error) {
            console.error('❌ Error test conectividad:', error);
        }
    }

    // Ejecutar test al cargar
    testConectividad();

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