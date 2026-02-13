"use client"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  LogIn, 
  Building2, 
  FileText, 
  RotateCcw, 
  BarChart3, 
  Users, 
  UserCog, 
  Shield,
  ChevronRight,
  Search,
  Download,
  Settings,
  Eye,
  Edit,
  Trash2,
  Key,
  Mail,
  Plus,
  Filter,
  Calendar,
  TrendingUp,
  Layers,
  HelpCircle,
  ClipboardList,
  CheckSquare,
  ListOrdered,
  Hash,
  Grid3X3
} from "lucide-react"

interface DocSection {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("inicio-sesion")
  const [activeTab, setActiveTab] = useState("usuario")

  const userDocs: DocSection[] = [
    {
      id: "inicio-sesion",
      title: "Inicio de Sesión",
      icon: <LogIn className="h-4 w-4" />,
      content: <InicioSesionDoc />
    },
    {
      id: "empresas",
      title: "Módulo de Empresas",
      icon: <Building2 className="h-4 w-4" />,
      content: <EmpresasDoc />
    },
    {
      id: "detalle-empresa",
      title: "Detalle de Empresa",
      icon: <FileText className="h-4 w-4" />,
      content: <DetalleEmpresaDoc />
    },
    {
      id: "detalle-encuesta",
      title: "Detalle de Encuesta",
      icon: <ClipboardList className="h-4 w-4" />,
      content: <DetalleEncuestaDoc />
    },
    {
      id: "rechequeos",
      title: "Módulo de Rechequeos",
      icon: <RotateCcw className="h-4 w-4" />,
      content: <RechequeosDoc />
    },
    {
      id: "dashboard",
      title: "Dashboard Looker",
      icon: <BarChart3 className="h-4 w-4" />,
      content: <DashboardDoc />
    },
    {
      id: "usuarios-sistema",
      title: "Usuarios del Sistema",
      icon: <UserCog className="h-4 w-4" />,
      content: <UsuariosSistemaDoc />
    },
    {
      id: "usuarios-empresas",
      title: "Usuarios de Empresas",
      icon: <Users className="h-4 w-4" />,
      content: <UsuariosEmpresasDoc />
    },
    {
      id: "roles-permisos",
      title: "Roles y Permisos",
      icon: <Shield className="h-4 w-4" />,
      content: <RolesPermisosDoc />
    }
  ]

  const currentDoc = userDocs.find(d => d.id === activeSection) || userDocs[0]

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1 text-[#150773]" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#150773]">Documentación</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#150773]">Documentación del Sistema</h1>
              <p className="text-gray-600 mt-2">
                Guías completas para utilizar todas las funcionalidades de Chequeo Digital
              </p>
            </div>
            <Badge className="bg-[#f5592b] text-white px-3 py-1">
              <BookOpen className="h-4 w-4 mr-1" />
              v2.0
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="usuario" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="usuario" className="data-[state=active]:bg-[#f5592b] data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-2" />
              Manuales de Usuario
            </TabsTrigger>
            <TabsTrigger value="resumen" className="data-[state=active]:bg-[#150773] data-[state=active]:text-white">
              <Layers className="h-4 w-4 mr-2" />
              Resumen del Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuario">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Sidebar de navegación */}
              <Card className="lg:col-span-1 border-[#f5592b]/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#150773] text-lg">Secciones</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {userDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setActiveSection(doc.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                          activeSection === doc.id
                            ? "bg-[#f5592b] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {doc.icon}
                        <span>{doc.title}</span>
                        <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                          activeSection === doc.id ? "rotate-90" : ""
                        }`} />
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              {/* Contenido principal */}
              <Card className="lg:col-span-3 border-[#150773]/20">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {currentDoc.icon}
                    <CardTitle className="text-[#150773]">{currentDoc.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                    {currentDoc.content}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resumen">
            <ResumenSistemaDoc />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

// ================================
// COMPONENTES DE DOCUMENTACIÓN
// ================================

function InicioSesionDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Acceso al Sistema</h3>
        <p className="text-gray-700 mb-4">
          Para acceder al sistema necesita credenciales proporcionadas por el administrador. 
          Utilice un navegador web moderno (Chrome, Firefox, Edge o Safari).
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-800 mb-2">URL de Acceso</h4>
          <code className="bg-white px-2 py-1 rounded text-sm">http://[SERVIDOR]:3000</code>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Pasos para Iniciar Sesión</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Abra su navegador y diríjase a la URL del sistema</li>
          <li>Ingrese su <strong>email</strong> en el campo correspondiente</li>
          <li>Ingrese su <strong>contraseña</strong></li>
          <li>Haga clic en el botón <strong>"Iniciar Sesión"</strong></li>
          <li>Si las credenciales son correctas, será redirigido al panel principal</li>
        </ol>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Roles de Usuario</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <Badge className="bg-purple-100 text-purple-800 mb-2">Superadmin</Badge>
            <p className="text-sm text-gray-700">Acceso completo a todas las funcionalidades del sistema, incluyendo administración de usuarios y permisos.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Badge className="bg-blue-100 text-blue-800 mb-2">Contributor</Badge>
            <p className="text-sm text-gray-700">Acceso operativo a empresas y rechequeos. Sin acceso a Testing ni administración de usuarios.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Badge className="bg-gray-100 text-gray-800 mb-2">Viewer</Badge>
            <p className="text-sm text-gray-700">Solo visualización del Dashboard Looker. Sin permisos de edición.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Cierre de Sesión</h3>
        <p className="text-gray-700 mb-2">
          Para cerrar sesión correctamente:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Haga clic en el ícono de usuario en la esquina superior derecha</li>
          <li>Seleccione la opción "Cerrar Sesión"</li>
          <li>Será redirigido a la pantalla de login</li>
        </ol>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> La sesión expira automáticamente después de 24 horas por seguridad.
          </p>
        </div>
      </section>
    </div>
  )
}

function EmpresasDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Descripción General</h3>
        <p className="text-gray-700">
          El módulo de <strong>Empresas</strong> es el centro de gestión donde puede explorar, buscar, 
          filtrar y exportar información de todas las empresas participantes en el programa de innovación.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Filtros de Fecha Rápidos
        </h3>
        <p className="text-gray-700 mb-3">
          En la parte superior encontrará botones para filtrar por períodos predefinidos:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {["Todos los tiempos", "Este mes", "Este semestre", "Este año", "Año pasado"].map((btn) => (
            <div key={btn} className="bg-gray-100 rounded px-3 py-2 text-center text-sm">{btn}</div>
          ))}
        </div>
        <p className="text-gray-700">
          También puede definir un rango de fechas personalizado usando los campos "Desde" y "Hasta".
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Filter className="h-5 w-5" /> Panel de Filtros
        </h3>
        <p className="text-gray-700 mb-3">El panel de filtros permite buscar por:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li><strong>Departamento:</strong> Ubicación geográfica</li>
          <li><strong>Distrito:</strong> Localidad específica</li>
          <li><strong>Nivel de Innovación:</strong> Inicial, Novato, Competente, Avanzado</li>
          <li><strong>Sector de Actividad:</strong> Industria, Comercio, Servicios, etc.</li>
          <li><strong>Sub-Sector:</strong> Categoría específica</li>
          <li><strong>Tamaño de Empresa:</strong> Según ventas anuales</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Observatorio de Chequeos</h3>
        <p className="text-gray-700 mb-3">
          La tabla principal muestra el listado de encuestas completadas. Para cada registro puede:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
            <div className="bg-[#f5592b] text-white p-1 rounded"><Eye className="h-4 w-4" /></div>
            <span className="text-sm"><strong>Ver Detalle:</strong> Navega al detalle completo de la empresa</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
            <div className="bg-[#150773] text-white p-1 rounded"><Edit className="h-4 w-4" /></div>
            <span className="text-sm"><strong>Reasignar:</strong> Mueve el chequeo a otro usuario (solo admins)</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
            <div className="bg-red-600 text-white p-1 rounded"><Trash2 className="h-4 w-4" /></div>
            <span className="text-sm"><strong>Eliminar:</strong> Elimina el registro permanentemente (solo superadmin)</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Modal de Reasignación</h3>
        <p className="text-gray-700 mb-3">
          Al hacer clic en <strong>"Reasignar"</strong> se abre un modal con:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li><strong>Chequeo Seleccionado:</strong> Muestra el usuario y fecha del chequeo actual</li>
          <li><strong>Reasignar a Usuario:</strong> Busque por Nombre, Email o IdUsuario</li>
          <li>Seleccione el usuario destino de la lista</li>
          <li>Confirme la reasignación</li>
        </ol>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Tipos de Eliminación</h3>
        <p className="text-gray-700 mb-3">
          Al eliminar un registro, seleccione el tipo de eliminación:
        </p>
        <div className="space-y-3">
          <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 rounded-r">
            <h4 className="font-medium text-yellow-800">1. Borrar el chequeo</h4>
            <p className="text-sm text-yellow-700">Elimina solo el chequeo seleccionado y sus respuestas.</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 rounded-r">
            <h4 className="font-medium text-orange-800">2. Borrar el chequeo y el usuario</h4>
            <p className="text-sm text-orange-700">Elimina el chequeo, el usuario y todos sus chequeos asociados.</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r">
            <h4 className="font-medium text-red-800">3. Borrar todo</h4>
            <p className="text-sm text-red-700">Elimina el chequeo, la empresa, el usuario y todos los datos relacionados.</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
          <p className="text-sm text-red-800"><strong>⚠️ Importante:</strong> Estas acciones son irreversibles.</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Download className="h-5 w-5" /> Exportación de Datos
        </h3>
        <p className="text-gray-700 mb-3">
          Use el botón "Exportar Reporte" para generar:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">📊 Excel (XLSX)</h4>
            <p className="text-sm text-gray-600">Resumen ejecutivo + listado completo de empresas</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">📄 PDF</h4>
            <p className="text-sm text-gray-600">Resumen ejecutivo con gráficos</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function DetalleEmpresaDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Acceso al Detalle</h3>
        <p className="text-gray-700">
          Acceda al detalle de una empresa haciendo clic en el botón "Ver Detalle" (ojo naranja) 
          desde el listado de empresas.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Información General</h3>
        <p className="text-gray-700 mb-3">
          La tarjeta principal muestra todos los datos de la empresa:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li>Nombre, RUC y datos de contacto</li>
          <li>Sector y subsector de actividad</li>
          <li>Ubicación (departamento y distrito)</li>
          <li>Año de creación y cantidad de empleados</li>
          <li>Ventas anuales y liderazgo</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Edit className="h-5 w-5" /> Edición de Datos
        </h3>
        <p className="text-gray-700 mb-3">
          Al hacer clic en el ícono de lápiz (✏️) se abre un modal con los siguientes campos editables:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="bg-gray-50 p-2 rounded">Nombre de la Empresa</div>
          <div className="bg-gray-50 p-2 rounded">RUC</div>
          <div className="bg-gray-50 p-2 rounded">Departamento</div>
          <div className="bg-gray-50 p-2 rounded">Distrito</div>
          <div className="bg-gray-50 p-2 rounded">Sector de Actividad</div>
          <div className="bg-gray-50 p-2 rounded">Sub-Sector</div>
          <div className="bg-gray-50 p-2 rounded">Año de Creación</div>
          <div className="bg-gray-50 p-2 rounded">Total de Empleados</div>
          <div className="bg-gray-50 p-2 rounded">Ventas Anuales</div>
          <div className="bg-gray-50 p-2 rounded">Sexo Gerente General</div>
          <div className="bg-gray-50 p-2 rounded">Sexo Propietario Principal</div>
        </div>
        <p className="text-sm text-gray-600">Modifique los campos y haga clic en <strong>"Guardar Cambios"</strong>.</p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" /> Gestión de Usuarios Asignados
        </h3>
        <p className="text-gray-700 mb-3">
          Haga clic en el ícono de usuarios (👥) para abrir el panel de gestión:
        </p>
        
        <div className="space-y-3">
          <div className="border rounded-lg p-3">
            <h4 className="font-medium text-green-700 mb-2">➕ Asignar Usuario Existente</h4>
            <p className="text-sm text-gray-600">Busque por nombre o email y seleccione el usuario para vincularlo a la empresa.</p>
          </div>
          
          <div className="border rounded-lg p-3">
            <h4 className="font-medium text-orange-700 mb-2">🔗 Desasignar Usuario</h4>
            <p className="text-sm text-gray-600">Rompe la relación entre el usuario y la empresa. <strong>Los chequeos del usuario bajo esta empresa serán eliminados</strong>, pero el usuario seguirá existiendo en el sistema.</p>
          </div>
          
          <div className="border rounded-lg p-3">
            <h4 className="font-medium text-red-700 mb-2">🗑️ Eliminar Usuario</h4>
            <p className="text-sm text-gray-600">Elimina completamente el usuario del sistema junto con <strong>todos sus chequeos</strong>. Esta acción es irreversible.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Resultados de Evaluación
        </h3>
        <p className="text-gray-700 mb-3">
          La sección de resultados muestra:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li>Badge con nivel de madurez y puntaje total</li>
          <li>Barras de progreso por cada dimensión de innovación</li>
          <li>Gráficos de evolución temporal (si hay múltiples chequeos)</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Historial de Encuestas</h3>
        <p className="text-gray-700 mb-3">
          En la pestaña "Historial de Encuestas" puede:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li>Ver todas las evaluaciones realizadas</li>
          <li>Comparar puntajes entre fechas</li>
          <li>Acceder a las respuestas detalladas de cada encuesta</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Download className="h-5 w-5" /> Exportar Ficha PDF
        </h3>
        <p className="text-gray-700">
          Use el botón "Exportar Ficha PDF" para generar un documento completo de la empresa 
          con toda su información y resultados de evaluación.
        </p>
      </section>
    </div>
  )
}

function DetalleEncuestaDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Acceso al Detalle de Encuesta</h3>
        <p className="text-gray-700 mb-3">
          Para ver las respuestas detalladas de una encuesta específica:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Acceda al <strong>Detalle de Empresa</strong></li>
          <li>En la sección <strong>"Historial de Evaluaciones"</strong>, localice la encuesta</li>
          <li>Haga clic en el botón <strong>"Ver Respuestas"</strong> (azul)</li>
          <li>Se abrirá la vista de respuestas detalladas</li>
        </ol>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Navegación por Dimensiones</h3>
        <p className="text-gray-700 mb-3">
          Las respuestas están organizadas en pestañas por <strong>dimensión de innovación</strong>:
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {["Todas", "Comunicación", "Datos", "Estrategia", "Organización", "Tecnología"].map((dim) => (
            <div key={dim} className="bg-gray-100 rounded px-2 py-1 text-center text-xs font-medium">{dim}</div>
          ))}
        </div>
        <p className="text-gray-600 text-sm">
          Use las pestañas para filtrar las preguntas por área de evaluación.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Tipos de Preguntas</h3>
        <p className="text-gray-700 mb-3">
          El sistema soporta diferentes tipos de preguntas, cada uno con su visualización:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <CheckSquare className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Selección Única</h4>
              <p className="text-sm text-gray-600">Una sola opción seleccionable (Sí/No, opciones excluyentes)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <CheckSquare className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Selección Múltiple</h4>
              <p className="text-sm text-gray-600">Varias opciones seleccionables (checkboxes)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <ListOrdered className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Ranking</h4>
              <p className="text-sm text-gray-600">Ordenar opciones por preferencia (#1, #2, #3...)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Hash className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Completar (Porcentaje)</h4>
              <p className="text-sm text-gray-600">Ingresar un valor numérico porcentual (0-100%)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Grid3X3 className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Bidimensional (Matriz)</h4>
              <p className="text-sm text-gray-600">Seleccionar frecuencia/uso para múltiples items</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Eye className="h-5 w-5" /> Ver Opciones Disponibles
        </h3>
        <p className="text-gray-700 mb-3">
          Para cada pregunta puede ver todas las opciones posibles:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Haga clic en el botón <strong>"Ver opciones"</strong> a la derecha de cada pregunta</li>
          <li>Se abrirá un modal mostrando:
            <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
              <li>La <strong>respuesta seleccionada</strong> (resaltada en verde)</li>
              <li>Todas las <strong>opciones disponibles</strong></li>
              <li>El <strong>tipo de pregunta</strong> y cómo interpretarla</li>
            </ul>
          </li>
        </ol>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Preguntas con Subrespuestas</h3>
        <p className="text-gray-700 mb-3">
          Algunas preguntas tienen subrespuestas adicionales (indicado con badge "Con subrespuestas"):
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li>Haga clic en el botón <strong>expandir (›)</strong> para ver todas las subrespuestas</li>
          <li>Cada subrespuesta muestra su valor y puntaje individual</li>
          <li>El texto indica cuántas respuestas adicionales hay</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Interpretación de Puntajes</h3>
        <p className="text-gray-700 mb-3">
          Cada respuesta muestra un puntaje con indicador de color:
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-green-600 font-bold mb-1">✓ Verde</div>
            <p className="text-xs text-green-700">Puntaje alto (&gt;0.5)</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="text-yellow-600 font-bold mb-1">⚠ Amarillo</div>
            <p className="text-xs text-yellow-700">Puntaje medio (0-0.5)</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="text-red-600 font-bold mb-1">✗ Rojo</div>
            <p className="text-xs text-red-700">Puntaje 0</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Navegación</h3>
        <p className="text-gray-700">
          Use el botón <strong>"Volver al Historial"</strong> para regresar al detalle de la empresa
          y ver otras encuestas del historial.
        </p>
      </section>
    </div>
  )
}

function RechequeosDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">¿Qué es un Rechequeo?</h3>
        <p className="text-gray-700">
          Un <strong>rechequeo</strong> es cuando una empresa completa una nueva encuesta de innovación 
          después de haber completado una anterior, con un intervalo mínimo de <strong>6 meses</strong> entre ambas.
          Este módulo analiza la <strong>evolución temporal</strong> de las empresas.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">KPIs de Rechequeos</h3>
        <p className="text-gray-700 mb-3">
          La primera sección muestra indicadores clave organizados en tres categorías:
        </p>
        
        <div className="space-y-4">
          <div className="border-l-4 border-[#f5592b] pl-4">
            <h4 className="font-medium text-gray-800">📊 Cobertura</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Tasa de Reincidencia: % de empresas que volvieron</li>
              <li>• Promedio de Chequeos por Empresa</li>
              <li>• Tiempo Promedio Entre Chequeos</li>
              <li>• Distribución: empresas con 1, 2-3, o más de 3 chequeos</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-[#150773] pl-4">
            <h4 className="font-medium text-gray-800">📈 Magnitud</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Delta Global Promedio: cambio en puntaje total</li>
              <li>• Delta por Dimensión: mejora en cada área</li>
              <li>• % con Mejora Positiva / % con Regresión</li>
              <li>• Saltos de Nivel: empresas que subieron de categoría</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-gray-800">⚡ Velocidad</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Tasa de Mejora Mensual: puntos/mes</li>
              <li>• Índice de Consistencia: % con mejora sostenida</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Heatmap de Mejora</h3>
        <p className="text-gray-700 mb-3">
          El heatmap muestra la mejora promedio para cada combinación de:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li><strong>Filas:</strong> Sectores de actividad económica</li>
          <li><strong>Columnas:</strong> Dimensiones de innovación</li>
          <li><strong>Color:</strong> Verde = mejora, Rojo = retroceso</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Tabla de Rechequeos</h3>
        <p className="text-gray-700 mb-3">
          La tabla detallada muestra cada empresa con rechequeos, incluyendo:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li>Nombre y datos de la empresa</li>
          <li>Total de chequeos realizados</li>
          <li>Puntaje del primer y último chequeo</li>
          <li>Delta de mejora</li>
          <li>Días transcurridos entre chequeos</li>
          <li>Tasa de mejora mensual</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Download className="h-5 w-5" /> Exportación
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <div className="bg-[#f5592b] text-white p-1 rounded text-xs">PDF</div>
              Exportar PDF
            </h4>
            <p className="text-sm text-gray-600">Resumen ejecutivo con KPIs y gráficos</p>
          </div>
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <div className="bg-[#150773] text-white p-1 rounded text-xs">CSV</div>
              Exportar CSV
            </h4>
            <p className="text-sm text-gray-600">Datos completos para análisis en Excel</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function DashboardDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Descripción</h3>
        <p className="text-gray-700">
          El <strong>Dashboard Looker</strong> es el panel de control central que proporciona una 
          vista general del estado del programa de innovación empresarial con métricas agregadas 
          y visualizaciones.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Métricas Principales</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-1">Total Empresas</h4>
            <p className="text-sm text-gray-600">Cantidad de empresas con chequeos completados</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-1">Nivel Promedio</h4>
            <p className="text-sm text-gray-600">Puntaje promedio general del programa</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-1">Por Nivel</h4>
            <p className="text-sm text-gray-600">Distribución de empresas por nivel de madurez</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-1">Por Sector</h4>
            <p className="text-sm text-gray-600">Distribución por actividad económica</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Acceso por Rol</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Todos los roles</strong> tienen acceso al Dashboard Looker. 
            Es la única vista disponible para usuarios con rol <strong>Viewer</strong>.
          </p>
        </div>
      </section>
    </div>
  )
}

function UsuariosSistemaDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Descripción</h3>
        <p className="text-gray-700">
          Este módulo permite gestionar las cuentas de los <strong>operadores del backoffice</strong> - 
          las personas que acceden al panel de control de Chequeo Digital.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-3">
          <p className="text-sm text-purple-800">
            <strong>Acceso:</strong> Solo disponible para usuarios con rol <strong>Superadmin</strong>.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Acciones Disponibles</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Plus className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Crear Usuario</h4>
              <p className="text-sm text-gray-600">Agregar un nuevo operador al sistema</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Edit className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Editar Usuario</h4>
              <p className="text-sm text-gray-600">Modificar nombre, email, rol u organización</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Key className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Resetear Contraseña</h4>
              <p className="text-sm text-gray-600">Establecer una nueva contraseña para el usuario</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Desactivar Usuario</h4>
              <p className="text-sm text-gray-600">Impide el acceso pero conserva los datos</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Campos al Crear Usuario</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li><strong>Nombre y Apellido:</strong> Obligatorios</li>
          <li><strong>Email:</strong> Debe ser único (se usa para login)</li>
          <li><strong>Contraseña:</strong> Mínimo 8 caracteres</li>
          <li><strong>Rol:</strong> Superadmin, Contributor o Viewer</li>
          <li><strong>Organización:</strong> Opcional</li>
          <li><strong>Teléfono:</strong> Opcional</li>
        </ul>
      </section>
    </div>
  )
}

function UsuariosEmpresasDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Descripción</h3>
        <p className="text-gray-700">
          Este módulo gestiona los <strong>usuarios encuestados</strong> - las personas que representan 
          a las empresas y completan las encuestas de chequeo de innovación.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="text-sm text-blue-800">
            <strong>Diferencia importante:</strong> Estos usuarios no acceden al backoffice, 
            solo completan las encuestas del programa.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
          <Search className="h-5 w-5" /> Búsqueda de Usuarios
        </h3>
        <p className="text-gray-700">
          Use el campo de búsqueda para encontrar usuarios por:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mt-2">
          <li>Nombre completo</li>
          <li>Email</li>
          <li>Nombre de empresa</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Acciones por Usuario</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Edit className="h-4 w-4" />
            <span className="text-sm">Editar información</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Mail className="h-4 w-4 text-green-600" />
            <span className="text-sm">Actualizar email</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Key className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Cambiar contraseña</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <Trash2 className="h-4 w-4 text-red-600" />
            <span className="text-sm">Eliminar usuario</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">⚠️ Advertencia sobre Eliminación</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <strong>La eliminación de un usuario es irreversible</strong> y elimina también 
            todos los chequeos realizados por ese usuario. Use esta opción con precaución.
          </p>
        </div>
      </section>
    </div>
  )
}

function RolesPermisosDoc() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Sistema RBAC</h3>
        <p className="text-gray-700">
          El sistema utiliza <strong>Control de Acceso Basado en Roles</strong> (RBAC) para determinar 
          qué acciones puede realizar cada usuario sobre cada recurso del sistema.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Roles Disponibles</h3>
        <div className="space-y-3">
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium">Superadmin</h4>
            <p className="text-sm text-gray-600">Acceso completo a todas las funcionalidades</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium">Contributor</h4>
            <p className="text-sm text-gray-600">Acceso operativo sin administración</p>
          </div>
          <div className="border-l-4 border-gray-400 pl-4">
            <h4 className="font-medium">Viewer</h4>
            <p className="text-sm text-gray-600">Solo visualización del Dashboard</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Tipos de Permisos</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-green-50 text-green-800 text-center p-2 rounded text-sm font-medium">Ver</div>
          <div className="bg-blue-50 text-blue-800 text-center p-2 rounded text-sm font-medium">Crear</div>
          <div className="bg-yellow-50 text-yellow-800 text-center p-2 rounded text-sm font-medium">Editar</div>
          <div className="bg-red-50 text-red-800 text-center p-2 rounded text-sm font-medium">Eliminar</div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Cada recurso puede tener habilitados independientemente estos 4 tipos de permisos.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-[#150773] mb-3">Editar Permisos</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>En la tarjeta del rol, haga clic en "Editar Permisos"</li>
          <li>Active o desactive los switches para cada recurso</li>
          <li>Haga clic en "Guardar Cambios"</li>
        </ol>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Los cambios se aplican inmediatamente a todos los usuarios con ese rol.
          </p>
        </div>
      </section>
    </div>
  )
}

function ResumenSistemaDoc() {
  return (
    <div className="space-y-6">
      <Card className="border-[#150773]/20">
        <CardHeader>
          <CardTitle className="text-[#150773]">Sobre Chequeo Digital 2.0</CardTitle>
          <CardDescription>
            Sistema de gestión y análisis para el programa de diagnóstico de madurez digital empresarial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-[#150773] mb-3">¿Qué es Chequeo Digital?</h3>
            <p className="text-gray-700">
              <strong>Chequeo Digital 2.0</strong> es un sistema web desarrollado para el Ministerio de 
              Industria y Comercio de Paraguay en colaboración con el BID. Permite gestionar y analizar 
              los resultados de las encuestas de chequeo de innovación realizadas a empresas paraguayas.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-[#150773] mb-3">Funcionalidades Principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-[#f5592b]" />
                  Dashboard Ejecutivo
                </h4>
                <p className="text-sm text-gray-600">Vista general con indicadores clave del programa</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-[#f5592b]" />
                  Gestión de Empresas
                </h4>
                <p className="text-sm text-gray-600">Listado con filtros avanzados y detalle completo</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <RotateCcw className="h-5 w-5 text-[#f5592b]" />
                  Análisis de Rechequeos
                </h4>
                <p className="text-sm text-gray-600">Medición de evolución temporal de empresas</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5 text-[#f5592b]" />
                  Exportación de Reportes
                </h4>
                <p className="text-sm text-gray-600">Generación de Excel y PDF</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-[#150773] mb-3">Niveles de Innovación</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="bg-red-100 text-red-800 rounded-lg p-3 mb-2">
                  <span className="font-bold text-lg">0-29</span>
                </div>
                <span className="text-sm font-medium">Inicial</span>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 text-yellow-800 rounded-lg p-3 mb-2">
                  <span className="font-bold text-lg">30-59</span>
                </div>
                <span className="text-sm font-medium">Novato</span>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-800 rounded-lg p-3 mb-2">
                  <span className="font-bold text-lg">60-79</span>
                </div>
                <span className="text-sm font-medium">Competente</span>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-800 rounded-lg p-3 mb-2">
                  <span className="font-bold text-lg">80-100</span>
                </div>
                <span className="text-sm font-medium">Avanzado</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-[#150773] mb-3">Dimensiones Evaluadas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {["Tecnología", "Comunicación", "Organización", "Datos", "Estrategia", "Procesos"].map((dim) => (
                <div key={dim} className="bg-[#150773]/5 rounded px-3 py-2 text-center text-sm font-medium text-[#150773]">
                  {dim}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-[#150773] mb-3 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" /> Soporte
            </h3>
            <p className="text-gray-700 mb-3">
              Para asistencia técnica o consultas sobre el sistema, contacte al administrador.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Versión:</strong> Chequeo Digital 2.0<br />
                <strong>Última actualización:</strong> Diciembre 2025
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
