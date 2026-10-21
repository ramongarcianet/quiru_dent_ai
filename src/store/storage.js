import { ref as StorageRef, uploadBytesResumable, getDownloadURL, getStorage, getMetadata, getBytes, deleteObject  } from "firebase/storage";
import {ref} from 'vue'
import {storage} from '../config/firebase'
export const progressFile = ref(0)
const mensajeErrorStorage = (codigo) => {
    const mensajes = {
        'storage/quota-exceeded': 'No se pudo cargar el archivo porque se superó la cuota de almacenamiento. Contacta al administrador del sistema.',
        'storage/unauthenticated': 'Debes iniciar sesión para cargar archivos.',
        'storage/unauthorized': 'No tienes permisos para cargar archivos.',
        'storage/retry-limit-exceeded': 'La carga tardó demasiado. Inténtalo nuevamente.',
        'storage/canceled': 'La carga fue cancelada.'
    }
    return mensajes[codigo] || 'No se pudo cargar el archivo. Inténtalo nuevamente.'
}
export const setFile = (file, idOdontograma, uniquePath = false) => new Promise( (resolve, reject )=> {
    if(!file) return reject( false )
    if(file.type != 'image/jpeg' && file.type != 'image/png' && file.type != 'application/pdf') return reject('formato no admitido')
    if(file.size > 4000000) return reject('archivo muy pesado')
    const uniqueFolder = uniquePath
        ? `${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}/`
        : ''
    const uploadTask = uploadBytesResumable(
        StorageRef(storage, 'documento/'+ idOdontograma+'/' + uniqueFolder + file.name ),
        file, 
        { contentType: file.type }
    )
    //+ new Date().toLocaleString('es-ES', {dateStyle:'medium', timeStyle:'medium'})
    uploadTask.on(
        'state_changed',
        snapshot => progressFile.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        error => {
            progressFile.value = 0
            reject(mensajeErrorStorage(error.code))
        },
        () => resolve(uploadTask.snapshot.ref.fullPath )
    )
})

export const dowFile = (file) => new Promise ( (resolve, reject)=>{
    if(!file) reject( false )
    return getDownloadURL(StorageRef(storage, file))
        .then((url) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = (event) => {
                const blob = xhr.response;
            };
            xhr.open('GET', url);
            //xhr.send();
            resolve()
        })
        .catch((error) => {
        });
})

export const borrarFile = (file) => new Promise ((resolve, reject) => {
    //console.log(file)
    const desertRef = StorageRef(storage, file);
    deleteObject(desertRef).then(() => {
      }).catch((error) => {

      });      
})

export const deleteStorageFile = (file) => deleteObject(StorageRef(storage, file))
export const getUrlbyFileRef = (fileRef) => getDownloadURL(StorageRef(storage, fileRef))
export const downloadbyFileRef = (fileRef) => getBytes(StorageRef(storage, fileRef))
export const getMetadataByFileRef = (fileRef) => getMetadata(StorageRef(storage, fileRef))

