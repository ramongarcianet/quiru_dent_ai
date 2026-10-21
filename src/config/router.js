import { createRouter, createWebHistory } from 'vue-router'
import { obtenerEstadoDeAutentificacion } from '../store/sesion'
const routes = [
    {
      path: '/',
      component: ()=>import('../views/6. Sesion/index.vue'),
      children: [
        /*{
            path:'la',
            name: 'landing',
            component: ()=>import('../views/6. Sesion/3. Landing.vue'),

        },*/
        {
            path:':codigo?',
            name: 'landingConCodigo',
            component: ()=>import('../views/6. Sesion/3. Landing.vue'),

        },
        {
            path:'demo/:codigo?',
            name: 'demo',
            component: ()=>import('../views/6. Sesion/2. Demo.vue'),
        },
        {
            path:'inscripcion/:codigo?',
            name: 'inscripcion',
            component: ()=>import('../views/6. Sesion/4. Inscripcion.vue'),
        },
        {
            path: '',
            component: ()=>import('../views/6. Sesion/1. Sesion.vue'),
            children: [
                {
                    path: '',
                    name: 'iniciar-sesion',
                    component: ()=>import('../views/6. Sesion/1.1 IniciarSesion.vue')
                },
                {
                    path: 'registro',
                    name: 'registro',
                    component: ()=>import('../views/6. Sesion/1.2 Registro.vue')
                },
                {
                    path: 'reset-contrasena',
                    name: 'reset-contrasena',
                    component: ()=>import('../views/6. Sesion/1.3 ResetContraseña.vue')
                },
                {
                    path: 'politica-privacidad',
                    name: 'politica-privacidad',
                    component: ()=>import('../views/6. Sesion/0. Politica.vue')
                },
            ]
        },
      ]
    },
    {
        path:'/dashboard',
        component: ()=>import('../views/dashboard.vue'),
        meta: { requiereAuth: true },
        children:[
            {
                path: 'usuarios',
                name: 'usuarios',
                component: ()=>import('../views/2.Usuarios/usuarios.vue')
            },
            {
                path: 'usuario/:idUsuario?',
                name: 'usuario',
                component: ()=>import('../views/2.Usuarios/usuario.vue')
            },
            {
                path: 'pacientes',
                name: 'pacientes',
                component: ()=>import('../views/3.Paciente/pacientes.vue')
            },
            {
                path: 'paciente/:idPaciente?',
                name: 'paciente',
                component: ()=>import('../views/3.Paciente/paciente.vue')
            },
            {
                path: 'pacientes/:idPaciente/atencion-ai',
                name: 'atencion-ai',
                component: ()=>import('../views/5.OdontogramaAI/AtencionAI.vue')
            },
            {
                path: 'paciente-informacion/:idPaciente?',
                component: ()=> import('../views/5.Odontograma/InformacionPaciente.vue'),
                children: [
                    {
                        path: 'pacienteVer',
                        name: 'pacienteVer',
                        component: ()=>import('../views/3.Paciente/pacienteVer.vue')
                    },
                    {
                        path: 'Detalle/:idOdontograma?',
                        name: 'Detalle',
                        component: ()=>import('../views/5.Odontograma/1.AsistenteDeVoz.vue')
                    }, 
                    {
                        path: 'Admision',
                        name: 'Admision',
                        component: ()=>import('../views/1.Admision/Admision.vue')
                    },
                ]
            },
            
            {
                path: 'diccionarios',
                name: 'diccionarios',
                component: ()=>import('../views/4.Diccionario/diccionarios.vue')
            },
            {
                path: 'diccionario/:idDiccionario?',
                name: 'diccionario',
                component: ()=>import('../views/4.Diccionario/diccionario.vue')
            },
            
            {
                path: 'impresion/:idOdontograma?/:idPaciente?',
                name: 'impresion',
                component: ()=>import('../views/5.Odontograma/2.impresion.vue')
            },
            {
                path: 'adicionales/:idOdontograma?/:idPaciente?',
                name: 'adicionales',
                component: ()=>import('../views/5.Odontograma/3.adicionales.vue')
            },
            {
                path: 'plantratamiento/:idOdontograma?/:idPaciente?',
                name: 'plantratamiento',
                component: ()=>import('../views/5.Odontograma/5.plantratamiento.vue')
            },
            {
                path: 'estadisticas',
                name: 'estadisticas',
                component: ()=>import('../views/7.Estadisticas/Estadistica.vue')
            },
            {
                path: 'cotizacion/:idOdontograma?/:idPaciente?',
                name: 'cotizacion',
                component: ()=>import('../views/5.Odontograma/4.cotizacion.vue')
            },
            {
                path: 'citas',
                name: 'citas',
                component: ()=>import('../views/10.Citas/citas.vue')
            },
            {
                path: 'administracion/:idUsuario?',
                name: 'admin',
                component: ()=> import('../views/5.Odontograma/0.Admin.vue'),
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,

})

router.beforeEach( async (to, from, next) => {
    const hayUsuario = await obtenerEstadoDeAutentificacion()
    const requiereAutentificacion = to.meta.requiereAuth
    if ( requiereAutentificacion && !hayUsuario ) next({name: "landing"})
    else next()
})

export default router
