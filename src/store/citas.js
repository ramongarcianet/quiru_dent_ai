import { ref } from 'vue';
import { setDoc, addDoc, collection, onSnapshot, getDoc, doc, updateDoc, deleteDoc, orderBy, query, where, Firestore } from 'firebase/firestore'
import { firestore } from '../config/firebase'
import { usuario } from '../store/sesion'
const dialog = ref(false)

const cita = ref({
  idPaciente: '',
  start: '',
  end: '',
  timeStart: '',
  timeEnd: '',
  title: '',
  borderColor: "#0dcaf0",
  backgroundColor: '#fd7e14',
  timedisplay: '',
  fechaDeCreacion: new Date().toISOString().slice(0, 10),
  UserId: '',
})
export const _event = ref([])
const guardarCita = async item => {
  const referencia = collection(firestore, 'citas')
  const newdoc = await addDoc(referencia, {
    ...item,
    UserId: usuario.value.uid,
    estado: true
  })
  await updateDoc(doc(firestore, 'citas', newdoc.id), { id: newdoc.id })
  return newdoc.id
}

const actualizar = (item) => {
  const referencia = doc(firestore, 'citas', item.id)
  return updateDoc(referencia, item)
}

const updateEstado = (item) => {
  const referencia = doc(firestore, 'citas', item.id)
  return updateDoc(referencia, { estado: false })
}

export const eliminar = (id) => {
  const referencia = doc(firestore, 'citas', id)
  return deleteDoc(referencia)
}

const registro = ref([])
const verEliminados = ref(false)
const obtenerTodos = () => {
  const referencia = collection(firestore, 'citas')
  const referenciaOrden = !verEliminados.value
    ? query(referencia, where('UserId', '==', usuario.value.uid), where('estado', '==', true))
    : query(referencia, where('UserId', '==', usuario.value.uid), orderBy("fechaDeCreacion", "desc"))
  return onSnapshot(
    referenciaOrden,
    collection => {
      registro.value = collection.docs.map(doc => ({ ...doc.data(), id: doc.id }))
    }
  )
}

const leer = id => {
  const referencia = doc(firestore, 'citas', id)
  return getDoc(referencia).then(doc => cita.value = doc.data())
}

const leerEnRegistro = id => {
  return cita.value = registro.value.find(item => cita.id == id)
}
const limpiar = () => {
  cita.value = {
    idPaciente: '',
    start: '',
    end: '',
    title: '',
    borderColor: "#0dcaf0",
    backgroundColor: '',
    timedisplay: '',
    fechaDeCreacion: new Date().toISOString().slice(0, 10),
    UserId: ''
  }
}


export {
  cita,
  actualizar,
  guardarCita,
  obtenerTodos,
  updateEstado,
  registro,
  leer,
  leerEnRegistro,
  limpiar,
}
