
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  // Acceso y sesión del administrador
  const esRutaAdmin = window.location.pathname === '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Registro de clientes
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [calle, setCalle] = useState('')
  const [mensajeRegistro, setMensajeRegistro] = useState('')
  // Sistema de préstamos
const [tokenSolicitud, setTokenSolicitud] = useState('')
const [montoPrestamo, setMontoPrestamo] = useState(20000)
const [plazoPrestamo, setPlazoPrestamo] = useState(6)
const [tasaPrestamo, setTasaPrestamo] = useState(5)
const [bancoSeleccionado, setBancoSeleccionado] = useState('')
const [resultadoPrestamo, setResultadoPrestamo] = useState(null)
const [mensajePrestamo, setMensajePrestamo] = useState('')
const bancos = [
  { nombre: 'Banreservas', imagen: '/logos/banreservas.jpeg' },
  { nombre: 'BHD', imagen: '/logos/bhd.jpeg' },
  { nombre: 'Banco Popular', imagen: '/logos/popular.jpeg' },
  { nombre: 'Scotiabank', imagen: '/logos/scotiabank.jpeg' }
]

  // Panel administrativo
  const [pagina, setPagina] = useState('Inicio')
  const [clientes, setClientes] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [busqueda, setBusqueda] = useState('')

  // Registro de cuentas bancarias
  const [clienteId, setClienteId] = useState('')
  const [banco, setBanco] = useState('')
  const [titularCuentaAdmin, setTitularCuentaAdmin] = useState('')
  const [tipoCuenta, setTipoCuenta] = useState('ahorro')
  const [numeroCuenta, setNumeroCuenta] = useState('')
  const [telefonoAsociado, setTelefonoAsociado] = useState('')
  const [cuentaPrincipal, setCuentaPrincipal] = useState(false)

  const modulos = [
    'Inicio',
    'Solicitudes',
    'Clientes',
    'Préstamos',
    'Pagos',
    'Cuotas',
    'Configuración',
    'Reportes',
    'Administradores'
  ]

  // Comprobar la sesión de Supabase
  useEffect(() => {
    let activo = true

    async function comprobarSesion() {
      const { data, error } = await supabase.auth.getSession()

      if (!activo) return

      if (error) {
        setError(error.message)
      }

      const usuario = data?.session?.user || null

      setUser(usuario)
      setIsAdmin(usuario?.app_metadata?.role === 'admin')
      console.log('Usuario:', usuario)
console.log('Rol:', usuario?.app_metadata?.role)
      setLoading(false)

      if (usuario && usuario.app_metadata?.role !== 'admin') {
        await supabase.auth.signOut()
        setUser(null)
        setIsAdmin(false)
        setError('Esta cuenta no tiene permisos de administrador.')
      }
    }

    comprobarSesion()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!activo) return

        const usuario = session?.user || null

        setUser(usuario)
        setIsAdmin(usuario?.app_metadata?.role === 'admin')
        setLoading(false)
      }
    )

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Cargar clientes cuando se abre esa sección
  useEffect(() => {
    if (user && isAdmin && pagina === 'Clientes') {
      cargarClientes()
    }
  }, [pagina, user, isAdmin])

  // Cargar solicitudes cuando se abre esa sección
  useEffect(() => {
    if (user && isAdmin && pagina === 'Solicitudes') {
      cargarSolicitudes()
    }
  }, [pagina, user, isAdmin])

  // Inicio de sesión del administrador
  async function iniciarSesion(e) {
    e.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut()
      setUser(null)
      setIsAdmin(false)
      setError('Esta cuenta no tiene permisos de administrador.')
      return
    }

    setUser(data.user)
    setIsAdmin(true)
    setPassword('')
  }

  // Cerrar sesión
  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setEmail('')
    setPassword('')
    setPagina('Inicio')
  }

  // Registrar cliente desde la página principal
  
async function registrarClientePublico(e) {
  e.preventDefault()
  setMensajeRegistro('')
  setMensajePrestamo('')
  setResultadoPrestamo(null)
  setGuardando(true)

  const { data, error } = await supabase.rpc(
    'registrar_cliente_publico',
    {
      p_nombre: nombre.trim(),
      p_telefono: telefono.trim(),
      p_direccion: direccion.trim(),
      p_calle: calle.trim()
    }
  )

  setGuardando(false)

  if (error) {
    setMensajeRegistro('Error al registrar: ' + error.message)
    return
  }

  setTokenSolicitud(data)
  setMensajeRegistro('¡Registro completado correctamente!')
  setNombre('')
  setTelefono('')
  setDireccion('')
  setCalle('')

  const { data: tasa, error: errorTasa } = await supabase.rpc(
    'obtener_tasa_prestamo'
  )

  if (errorTasa) {
    setMensajePrestamo('No se pudo consultar la tasa de interés.')
    return
  }

  setTasaPrestamo(Number(tasa))
}

  // Cargar clientes
  async function cargarClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setClientes(data || [])
  }
async function cargarSolicitudes()
  // Cargar solicitudes
   {
  console.log('Cargando solicitudes...')

  const { data, error } = await supabase
    .from('solicitudes_clientes')
    .select('*')
    .order('id', { ascending: false })

  console.log('Solicitudes recibidas:', data)
  console.log('Calle recibida:', data?.map(s => s.calle))
  console.log('Error de solicitudes:', error)

  if (error) {
    setError(error.message)
    return
  }

  setSolicitudes(data || [])
}

  // Cargar cuentas bancarias de un cliente
  async function cargarCuentas(id) {
    const { data, error } = await supabase
      .from('cuentas_clientes')
      .select('*')
      .eq('cliente_id', id)

    if (error) {
      setError(error.message)
      return
    }

    setCuentas(data || [])
  }

  // Seleccionar un cliente
  async function seleccionarCliente(cliente) {
    setClienteSeleccionado(cliente)
    setCuentas([])
    await cargarCuentas(cliente.id)
  }

  // Registrar una cuenta bancaria
  async function registrarCuenta(e) {
    e.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)

    const { error } = await supabase
      .from('cuentas_clientes')
      .insert([
        {
          cliente_id: clienteId,
          banco,
          titular: titularCuentaAdmin,
          tipo_cuenta: tipoCuenta,
          numero_cuenta: numeroCuenta,
          telefono_asociado: telefonoAsociado,
          cuenta_principal: cuentaPrincipal
        }
      ])

    setGuardando(false)

    if (error) {
      setError(error.message)
      return
    }

    setMensaje('Cuenta bancaria registrada correctamente.')

    setBanco('')
    setTitularCuentaAdmin('')
    setTipoCuenta('ahorro')
    setNumeroCuenta('')
    setTelefonoAsociado('')
    setCuentaPrincipal(false)

    if (clienteSeleccionado?.id === Number(clienteId)) {
      cargarCuentas(clienteId)
    }
  }

  
async function solicitarPrestamo(e) {
  e.preventDefault()
  setMensajePrestamo('')
  setResultadoPrestamo(null)
  setGuardando(true)

  const { data, error } = await supabase.rpc(
    'crear_prestamo_automatico',
    {
      p_token: tokenSolicitud,
      p_monto: Number(montoPrestamo),
      p_plazo: Number(plazoPrestamo)
    }
  )

  setGuardando(false)

  if (error) {
    setMensajePrestamo('No se pudo procesar: ' + error.message)
    return
  }

  setResultadoPrestamo(data)
  setMensajePrestamo('¡Tu préstamo ha sido aprobado automáticamente!')
}

  // Pantalla de carga
  if (loading) {
    return (
      <div className="app">
        <section className="panel">
          <h2>Cargando...</h2>
        </section>
      </div>
    )
  }

  // Página pública de registro de clientes
  
if (!esRutaAdmin) {
  const intereses = montoPrestamo * tasaPrestamo / 100 * plazoPrestamo
  const totalPagar = montoPrestamo + intereses
  const cuotaMensual = totalPagar / plazoPrestamo

  return (
    <div className="app">
      <main className="contenido">
        <div className="solicitud-container">
<div className="billetes-decorativos">
  {Array.from({ length: 18 }, (_, i) => (
    <img
      key={i}
      className={`billete billete-${i % 4}`}
      src={i % 2 === 0
        ? "https://cdn.bancentral.gov.do/documents/billetes-y-monedas/images/Anverso-2000-2025.jpg"
        : "https://cdn.bancentral.gov.do/documents/billetes-y-monedas/images/Reverso-2000-2025.jpg"}
      alt=""
      style={{
        left: `${(i * 37) % 95}%`,
        top: `${(i * 23) % 95}%`,
        animationDelay: `${i * 0.3}s`
      }}
    />
  ))}
</div>

          <section className="solicitud-header">
            <div className="solicitud-etiqueta">
              DINERO EXPRESS
            </div>

            <h2>
              {tokenSolicitud
                ? 'Tu próximo paso financiero'
                : 'Bienvenido a una nueva oportunidad'}
            </h2>

            <p>
              Soluciones financieras sencillas, rápidas y transparentes.
            </p>
          </section>

          {!tokenSolicitud ? (
            <section className="prestamo-card">
              <div className="prestamo-icono">👤</div>
              <h2>Crear mi cuenta</h2>
              <p>Completa tus datos para comenzar.</p>

              <form onSubmit={registrarClientePublico}>
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Tu nombre completo"
                />

                <label>Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  placeholder="Tu número de teléfono"
                />

                <label>Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                  placeholder="Tu dirección"
                />

                <label>Calle</label>
                <input
                  type="text"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  required
                  placeholder="Nombre de tu calle"
                />

                <button type="submit" disabled={guardando}>
                  {guardando ? 'Registrando...' : 'Crear mi cuenta →'}
                </button>
              </form>

              {mensajeRegistro && <p>{mensajeRegistro}</p>}
            </section>
          ) : (
            <>
              <section className="prestamo-card">
                <div className="prestamo-icono">💰</div>
                <h2>Solicita tu préstamo</h2>
                <p>Selecciona el monto que necesitas.</p>

                <form onSubmit={solicitarPrestamo}>
                  <label>Monto del préstamo</label>
                  <select
                    value={montoPrestamo}
                    onChange={(e) => setMontoPrestamo(Number(e.target.value))}
                  >
                    {[20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000].map((monto) => (
                      <option key={monto} value={monto}>
                        RD${monto.toLocaleString('es-DO')}
                      </option>
                    ))}
                  </select>

                  <label>Plazo de devolución</label>
                  <select
                    value={plazoPrestamo}
                    onChange={(e) => setPlazoPrestamo(Number(e.target.value))}
                  >
                    {[3, 6, 9, 12, 18, 24].map((meses) => (
                      <option key={meses} value={meses}>
                        {meses} meses
                      </option>
                    ))}
                  </select>
                  <label>Selecciona tu banco</label>

<div className="bancos-opciones">
  {bancos.map((banco) => (
    <button
      key={banco.nombre}
      type="button"
      className={`banco-opcion ${bancoSeleccionado === banco.nombre ? 'seleccionado' : ''}`}
      onClick={() => setBancoSeleccionado(banco.nombre)}
    >
      <img src={banco.imagen} alt={banco.nombre} />
      <span>{banco.nombre}</span>
    </button>
  ))}
</div>

                  <div className="resumen-card">
                    <h3>Resumen de tu préstamo</h3>

                    <div className="resumen-fila">
                      <span>Monto solicitado</span>
                      <strong>RD${montoPrestamo.toLocaleString('es-DO')}</strong>
                    </div>

                    <div className="resumen-fila">
                      <span>Interés mensual</span>
                      <strong>{tasaPrestamo}%</strong>
                    </div>

                    <div className="resumen-fila">
                      <span>Intereses totales</span>
                      <strong>RD${intereses.toLocaleString('es-DO')}</strong>
                    </div>

                    <div className="resumen-fila">
                      <span>Plazo</span>
                      <strong>{plazoPrestamo} meses</strong>
                    </div>

                    <div className="resumen-fila resumen-total">
                      <span>Total a devolver</span>
                      <strong>RD${totalPagar.toLocaleString('es-DO')}</strong>
                    </div>

                    <div className="resumen-fila">
                      <span>Cuota mensual aproximada</span>
                      <strong>
                        RD${cuotaMensual.toLocaleString('es-DO', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                    </div>
                  </div>

                  <p className="nota-prestamo">
                    El préstamo se procesa automáticamente. La aprobación
                    no significa que el dinero ya haya sido desembolsado.
                  </p>

                  <button type="submit" disabled={guardando}>
                    {guardando ? 'Procesando...' : 'Solicitar mi préstamo →'}
                  </button>
                </form>

                {mensajePrestamo && <p>{mensajePrestamo}</p>}
              </section>

              {resultadoPrestamo && (
                <section className="resumen-card">
                  <h2>¡Préstamo aprobado!</h2>
                  <p>Solicitud: #{resultadoPrestamo.prestamo_id}</p>
                  <p>Estado: {resultadoPrestamo.estado}</p>
                  <p>
                    Total a pagar: RD$
                    {Number(resultadoPrestamo.total_pagar).toLocaleString('es-DO')}
                  </p>
                  <p className="nota-prestamo">
                    El desembolso del dinero debe realizarse por separado.
                  </p>
                </section>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  )
}

  // Página de inicio de sesión del administrador
  if (!user || !isAdmin) {
    return (
      <div className="app">
        <main className="contenido">
          <section className="panel">
            <h1>Dinero Express</h1>
            <h2>Acceso de administrador</h2>

            <form onSubmit={iniciarSesion}>
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Correo del administrador"
              />

              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Contraseña"
              />

              <button type="submit" disabled={guardando}>
                {guardando ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            {error && <p>{error}</p>}

            <p>
              <a href="/">Volver al registro de clientes</a>
            </p>
          </section>
        </main>
      </div>
    )
  }

  // Panel administrativo
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Dinero Express</h2>

        <nav>
          {modulos.map((modulo) => (
            <button
              key={modulo}
              onClick={() => {
                setPagina(modulo)
                setError('')
                setMensaje('')
                setClienteSeleccionado(null)
              }}
            >
              {modulo}
            </button>
          ))}
        </nav>

        <button onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <main className="contenido">
        <header>
          <h1>{pagina}</h1>
          <p>{user.email}</p>
        </header>

        {error && <p>{error}</p>}
        {mensaje && <p>{mensaje}</p>}

        {pagina === 'Inicio' && (
          <section className="panel">
            <h2>Bienvenido a Dinero Express</h2>
            <p>Panel de administración.</p>

            <button onClick={() => setPagina('Clientes')}>
              Ver clientes
            </button>

            <button onClick={() => setPagina('Solicitudes')}>
              Ver solicitudes
            </button>
          </section>
        )}

        {pagina === 'Clientes' && (
          <section className="panel">
            {clienteSeleccionado ? (
              <>
                <button
                  onClick={() => setClienteSeleccionado(null)}
                >
                  ← Volver a clientes
                </button>

                <h2>Información del cliente</h2>

                <p><strong>Nombre:</strong> {clienteSeleccionado.nombre}</p>
                <p><strong>Teléfono:</strong> {clienteSeleccionado.telefono}</p>
                <p><strong>Dirección:</strong> {clienteSeleccionado.direccion}</p>
                <p><strong>Calle:</strong> {clienteSeleccionado.calle}</p>

                <hr />

                <h3>Cuentas bancarias</h3>

                {cuentas.length === 0 ? (
                  <p>Este cliente no tiene cuentas registradas.</p>
                ) : (
                  cuentas.map((cuenta) => (
                    <div className="panel" key={cuenta.id}>
                      <p><strong>Banco:</strong> {cuenta.banco}</p>
                      <p><strong>Titular:</strong> {cuenta.titular}</p>
                      <p><strong>Tipo:</strong> {cuenta.tipo_cuenta}</p>
                      <p><strong>Número:</strong> {cuenta.numero_cuenta}</p>
                      <p><strong>Teléfono asociado:</strong> {cuenta.telefono_asociado}</p>
                      <p>
                        <strong>Principal:</strong>{' '}
                        {cuenta.cuenta_principal ? 'Sí' : 'No'}
                      </p>
                    </div>
                  ))
                )}
              </>
            ) : (
              <>
                <h2>Clientes registrados</h2>

                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />

                <button onClick={cargarClientes}>
                  Actualizar lista
                </button>

                {clientes
                  .filter((cliente) =>
                    (cliente.nombre || '')
                      .toLowerCase()
                      .includes(busqueda.toLowerCase())
                  )
                  .map((cliente) => (
                    <div className="panel" key={cliente.id}>
                      <h3>{cliente.nombre}</h3>
                      <p>Teléfono: {cliente.telefono}</p>
                      <p>Dirección: {cliente.direccion}</p>

                      <button
                        onClick={() => seleccionarCliente(cliente)}
                      >
                        Ver detalles y cuentas
                      </button>
                    </div>
                  ))}

                {clientes.length === 0 && (
                  <p>No hay clientes registrados.</p>
                )}
              </>
            )}

            <hr />

            <h2>Registrar cuenta bancaria</h2>

            <form onSubmit={registrarCuenta}>
              <label>Seleccionar cliente</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>

              <label>Banco</label>
              <input
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                required
                placeholder="Nombre del banco"
              />

              <label>Titular de la cuenta</label>
              <input
                value={titularCuentaAdmin}
                onChange={(e) => setTitularCuentaAdmin(e.target.value)}
                required
              />

              <label>Tipo de cuenta</label>
              <select
                value={tipoCuenta}
                onChange={(e) => setTipoCuenta(e.target.value)}
              >
                <option value="ahorro">Ahorro</option>
                <option value="corriente">Corriente</option>
              </select>

              <label>Número de cuenta</label>
              <input
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                required
              />

              <label>Teléfono asociado</label>
              <input
                value={telefonoAsociado}
                onChange={(e) => setTelefonoAsociado(e.target.value)}
              />

              <label>
                <input
                  type="checkbox"
                  checked={cuentaPrincipal}
                  onChange={(e) => setCuentaPrincipal(e.target.checked)}
                />
                Cuenta principal
              </label>

              <button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cuenta'}
              </button>
            </form>
          </section>
        )}

        {pagina === 'Solicitudes' && (
          <section className="panel">
            <h2>Solicitudes recibidas</h2>

            <button onClick={cargarSolicitudes}>
              Actualizar solicitudes
            </button>

            {solicitudes.length === 0 ? (
              <p>No hay solicitudes registradas.</p>
            ) : (
              solicitudes.map((solicitud) => (
                <div className="panel" key={solicitud.id}>
                  <h3>Solicitud #{solicitud.id}</h3>
                  <p>Nombre: {solicitud.nombre}</p>
                  <p>Teléfono: {solicitud.telefono}</p>
                  <p>Dirección: {solicitud.direccion}</p>
                  <p>Dirección: {solicitud.direccion}</p>
<p>Banco: {solicitud.banco}</p>
                  <p>Banco: {solicitud.banco}</p>
                  <p>Estado: {solicitud.estado}</p>
                  <p>Fecha: {solicitud.fecha_registro}</p>
                </div>
              ))
            )}
          </section>
        )}

        {pagina === 'Préstamos' && (
          <section className="panel">
            <h2>Administración de préstamos</h2>
            <p>
              Este módulo se conectará cuando confirmemos la estructura
              de la tabla de préstamos y la forma de calcular los intereses.
            </p>
          </section>
        )}

        {pagina === 'Pagos' && (
          <section className="panel">
            <h2>Pagos</h2>
            <p>Módulo pendiente de conectar a la base de datos.</p>
          </section>
        )}

        {pagina === 'Cuotas' && (
          <section className="panel">
            <h2>Cuotas</h2>
            <p>Módulo pendiente de conectar a la base de datos.</p>
          </section>
        )}

        {pagina === 'Configuración' && (
          <section className="panel">
            <h2>Configuración</h2>
            <p>Configuración general de Dinero Express.</p>
          </section>
        )}

        {pagina === 'Reportes' && (
          <section className="panel">
            <h2>Reportes</h2>
            <p>Módulo de reportes pendiente de conectar.</p>
          </section>
        )}

        {pagina === 'Administradores' && (
          <section className="panel">
            <h2>Administradores</h2>
            <p>
              La administración de permisos se configurará
              de forma segura desde Supabase.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
