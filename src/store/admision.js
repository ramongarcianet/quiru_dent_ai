import { computed, ref } from 'vue';
import { addDoc, collection, onSnapshot, getDocs, doc, updateDoc, deleteDoc, query, where} from 'firebase/firestore'
import { firestore } from '../config/firebase'
import { miUsuario } from './sesion';
import {useRouter} from 'vue-router'
export const dialog = ref( false )

export const item = ref ({})

export const registro = ref([])

export const guardar = (item, idPaciente) => {
    const referencia = collection(firestore, 'admision')
    return addDoc(referencia, {
        ...item,
        idPaciente: idPaciente,
        odontologoId: miUsuario()?.uid,
        fechaAdmision: new Date()
    })
}

export const actualizar = (item) => {
    const referencia = doc(firestore, 'admision', item.id)
    return updateDoc(referencia, item)
}

export const eliminar = (id) => {
    const referencia = doc(firestore, 'admision', id)
    return deleteDoc(referencia)
}

export const obtenerTodos = idPaciente => {
    const referencia = query(collection(firestore, 'admision'), where( 'idPaciente', '==', idPaciente))
    return onSnapshot( referencia , coll =>{
        if (coll.empty) return item.value = {}
        item.value = coll.docs.map(item => ({...item.data(), id: item.id})) [0]
    } )
}

export const leer = async idPaciente => {
    const referencia = query(collection(firestore, 'admision'), where('idPaciente', '==', idPaciente))
    const resultado = await getDocs(referencia)
    item.value = resultado.empty
        ? {}
        : { ...resultado.docs[0].data(), id: resultado.docs[0].id }
    return item.value
}

export const leerEnRegistro = computed( ()=> idPaciente => {
    return item.value = registro.value.find(item => item.idPaciente == idPaciente) || {}
} )

export const obtenerPacienteAdmision = idPaciente => new Promise( resolve => {
    const referencia = query(collection(firestore, 'admision'), where( 'idPaciente', '==', idPaciente))
    return getDocs( referencia ).then( coll => resolve(coll.docs.map(item => ({...item.data(), id: item.id}))) )
} )

export const limpiar = () => {
    item.value = {
        tipoDocumento: 'DNI',
        sexo: '',
        fechaNacimiento: new Date().toISOString().slice(0, 10),
        fechaAdmision: new Date().toISOString().slice(0, 10),
        constancia:'N'
    }
}
