<script setup>
import Formulario from "./Formulario.vue";
import { registroodonto, guardar as guardarOdontograma, getItemEnRegistro } from "../../store/formodontograma";
import { item as itemPas, leer, actualizar } from "../../store/paciente";
import { useRoute, useRouter } from "vue-router";
import { activarVoz, isSpeech } from "../../store/odontograma";
import Cie10 from '../../config/Cie10.json';
import { leerEnRegistro as ObtenerOdontograma, item as itemodontograma, eliminar } from '../../store/formodontograma';
import jsPDF from 'jsPDF'
import Instrucciones from "./../8.Ayuda/instrucciones.vue";
import { watch, ref, computed } from "vue";
import { item } from "../../store/usuario";
import MicroButtonVue from "../../components/MicroButton.vue";
import autoTable from 'jspdf-autotable'
const myModal = document.getElementById('myModal')
const myInput = document.getElementById('myInput')
const route = useRoute()
const { back, push } = useRouter();
const itemSeleccionado = ref({})
const groupedDataResumen = ref([])
let canvas;
let canvas_image_data;
if (route.params.idPaciente) {
  leer(route.params.idPaciente)
}
//oncreated
if (route.params.idOdontograma) {
  ObtenerOdontograma(route.params.idOdontograma);
}
//onwatch
watch(
  () => route.params.idOdontograma,
  () => ObtenerOdontograma(route.params.idOdontograma),
)
const listaResumen = computed(() => {
  return groupedDataResumen.value.filter((elem) => elem.diagnostico != "")
});
function printOdontograma() {
  var pdf = new jsPDF()
  canvas = document.getElementById('myCanvas');
  canvas_image_data = canvas.toDataURL();
  let posis = 37;
  let posis1 = 0;
  if (itemodontograma.value?.hallazgos != undefined) {


    pdf.html("", {
      callback: function (pdf) {
        pdf.setFontSize(17);
        pdf.setFont(undefined, 'bold')
        pdf.text(30, 20, 'FICHA DE IDENTIFICACIÓN SANITARIA/ FICHA DENTAL');
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(12);
        pdf.text(10, 30, pad('NOMBRE : ' + itemPas.value.nombre, 80, ' ') + pad('APELLIDOS : ' + itemPas.value.apellidoPaterno + ' ' + itemPas.value.apellidoMaterno, 90, ' '));
        pdf.text(10, 37, pad('FECH. NAC: ' + itemPas.value.fechaNacimiento, 80, ' ') + pad('TIM/DNI : ' + itemPas.value.numeroDocumento, 90, ' '));
        pdf.text(10, 44, pad('DIRECCIÓN : ' + itemPas.value.Direccion, 180, ' '));
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold')
        pdf.text(80, 55, 'ODONTOGRAMA');
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(12);
        pdf.addImage(canvas_image_data, 'JPEG', 30, 55, 140, 140)
        pdf.insertPage();
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold')
        pdf.text(10, 20, 'DIAGNÓSTICO');
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(12);
        let _body = [];
        itemodontograma.value.hallazgos.forEach(_item => {
          let alterno = _item.dienteAlterno
          let sigla = _item.sigla
          let ubicacion = _item.ubicacion
          if (alterno) alterno = ' - ' + alterno.toString()
          if (ubicacion) ubicacion = ' - ' + ubicacion;
          if (sigla) sigla = ' (' + sigla + ')';
          _body.push([_item.diente + alterno, _item.descripcion + ubicacion + sigla])
        })
        var headerOptions = {
          fillColor: '#eef4ff',
          textColor: '#071b40'
        };
        var startX = 10;
        var startY = 25;
        autoTable(pdf, {
          head: [['Pieza(s)', 'Diagnóstico']],
          body: _body,
          startX: startX,
          startY: startY,
          didParseCell: function (data) {
            if (data.section === 'head') {
              data.cell.styles.fillColor = headerOptions.fillColor;
              data.cell.styles.textColor = headerOptions.textColor;
            }
          }
        })
        let _bodyPlant = [];

        itemodontograma.value.planTrata.forEach(_item => {
          let _tratamien = "";
          let fila = 1;
          let filas = _item.Tratamiento.length;
          _item.Tratamiento.forEach(subitem => {
            _tratamien = _tratamien + fila + '.- ' + subitem.Tratamiento.label + ' (' + subitem.Fecha + ')';
            if (fila < filas) {
              _tratamien = _tratamien + '),\n'
            }
            fila = fila + 1;
          })
          _bodyPlant.push([_item.Pieza, _item.Diagnostico, _tratamien])
        })
        startX = 10;
        startY = 40 + (itemodontograma.value.hallazgos.length * 8);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold')
        pdf.text(10, startY, 'PLAN DE TRATAMIENTO');
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(12);
        startY = startY + 5;
        autoTable(pdf, {
          head: [['Pieza(s)', 'Diagnóstico', 'Tratamiento(s)']],
          body: _bodyPlant,
          startX: startX,
          startY: startY,
          didParseCell: function (data) {
            if (data.section === 'head') {
              data.cell.styles.fillColor = headerOptions.fillColor;
              data.cell.styles.textColor = headerOptions.textColor;
            }
          }
        })

        var pdfName = itemPas.value.numeroDocumento
        pdf.save(pdfName + '.pdf');
      }
    });
  }
  else {
    var alerta = document.getElementById("alerta");
    alerta.style.display = "block";
  }
}
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}
function CallConfirm2(item) {
  itemSeleccionado.value = item;
  var modal = document.getElementById('id02');
  modal.style.display = 'block';
}
function EliminarOdonto() {
  var alerto = document.getElementById("alerto");
  var modal = document.getElementById('id02');
  if (!itemSeleccionado.value?.hallazgos || itemSeleccionado.value?.hallazgos.length == 0) {
    alerto.style.display = "none";
    modal.style.display = 'none';
    eliminar(itemSeleccionado.value.id)
    push({ name: 'pacienteVer', params: { idPaciente: route.params.idPaciente } })
  }
  else {
    alerto.style.display = "block";
    modal.style.display = 'none';

  }
}
function Cancelar() {
  var alerto = document.getElementById("alerto");
  var alerta = document.getElementById("alerta");
  var modal = document.getElementById('id02');
  alerto.style.display = "none";
  modal.style.display = 'none';
  alerta.style.display = "none";
}
function guardar_(var1, var2, var3, var4) {
  guardarOdontograma(var1, var2, var3, var4).then(idTratamiento => push({ name: 'Detalle', params: { idOdontograma: idTratamiento, idPaciente: route.params.idPaciente, tipoOdonto: 'Tratamiento' } }))
  var hol = document.getElementById("holo");
  hol.style.display = "none";

}

const idRelacionados_ = computed((() => id => getItemEnRegistro(id)?.idRelacionados))
const idDiagnostico_ = itemodontograma?.value.id;

const visto = ref(1)
watch(
  () => itemPas.value,
  () => {
    visto.value = itemPas.value?.visto || 0;
  }
);
const finalizar = () => {
  visto.value = 1
  itemPas.value.id = route.params.idPaciente
  itemPas.value.visto = 1
  actualizar(itemPas.value)
}
const visitaGuiada = [
  { id: '1', topResponsiveCari: '80%', topBurbujaResponsive: '55%', leftResponsiveCari: '20px', leftResponsiveBurbuja: '20%', top: '45%', left: '20px', topBurbuja: '30%', elementoDestacado: 'destacarMicrofono', scroll: '0', data: "Hola, soy el asistente de voz de QUIRU Dent AI. Puedes activarme diciendo “Hola Quiru” o presionando el micrófono" },
  { id: '2', topResponsiveCari: '80%', topBurbujaResponsive: '25%', leftResponsiveCari: '20px', leftResponsiveBurbuja: '20%', top: '77%', left: '20px', topBurbuja: '62%', elementoDestacado: 'destacarOdontograma', scroll: '500', data: "Este es tu nuevo odontograma, se llena de forma automática luego de cada registro dictado por voz." },
  { id: '3', topResponsiveCari: '80%', topBurbujaResponsive: '25%', leftResponsiveCari: '20px', leftResponsiveBurbuja: '20%', top: '30%', left: '20px', topBurbuja: '15%', elementoDestacado: 'destacarImpresion', scroll: '0', data: "Este es el botón de impresión, para tener tu odontograma en formato pdf o mandarlo a imprimir de una vez" },
  { id: "4", topResponsiveCari: '80%', topBurbujaResponsive: '25%', leftResponsiveCari: '20px', leftResponsiveBurbuja: '20%', top: '30%', left: '20px', topBurbuja: '15%', elementoDestacado: 'destacarAyuda', scroll: '0', data: "Aquí puedes ver los distintos comandos de voz de QUIRU Dent AI." },
  { id: "5", topResponsiveCari: '80%', topBurbujaResponsive: '35%', leftResponsiveCari: '20px', leftResponsiveBurbuja: '20%', top: '45%', left: '20px', topBurbuja: '30%', elementoDestacado: '', scroll: '0', data: "Y eso es todo, experimenta la nueva forma de atender a tus pacientes." },
]
const indice = ref(0)
const item2 = ref({ id: '1', topResponsiveCari: '80%', topBurbujaResponsive: '55%', leftResponsiveCari: '20px', leftResponsiveBurbuja: '20%', top: '45%', left: '20px', topBurbuja: '30%', elementoDestacado: 'destacarMicrofono', scroll: '0', data: "Hola, soy el asistente de voz de QUIRU Dent AI. Puedes activarme diciendo “Hola Quiru” o presionando el micrófono" },
)
let position = ref(0)
const moverCarrusel = (adelanteOAtras) => {
  indice.value = indice.value + adelanteOAtras
  let anterior = (indice.value == 0) ? visitaGuiada[0] : visitaGuiada[indice.value - 1]
  let posterior = (indice.value == 3) ? visitaGuiada[3] : visitaGuiada[indice.value + 1]
  item2.value = visitaGuiada[indice.value]
  position.value = window.scrollY
  window.scrollTo({
    top: item2.value.scroll,
    left: 0,
    behavior: 'smooth',
  })
  let noDestacar = document.getElementById(anterior.elementoDestacado)
  noDestacar.classList.add('noElevar')
  let noDestacarPosterior = document.getElementById(posterior.elementoDestacado)
  noDestacarPosterior.classList.add('noElevar')
  let destacar = document.getElementById(item2.value.elementoDestacado)
  destacar.classList.remove('noElevar')
  destacar.classList.add('elevar')

}

function activarAyuda() {
  var verAyuda = document.getElementById("AyudaCard");
  verAyuda.style.display = "flex"
  if (isSpeech.value == false) {
    activarVoz()
  }
}
function verDiagnostico() {
  const groupedData = {};
  groupedDataResumen.value = [];
  const dientesPorHallazgo = {};
  let dientesvalue = [];
  itemodontograma.value.hallazgos.forEach(item => {
    const { diente } = item;
    if (!(diente in dientesPorHallazgo)) {
      dientesPorHallazgo[diente] = [];
      dientesvalue.push({ diagnostico: item.hallazgo, diente: diente })
    }
  })
  itemodontograma.value.hallazgos.forEach(item => {
    const { hallazgo } = item;

    if (!(hallazgo in groupedData)) {
      let dientes = ""
      let descie10 = ""
      let CIE10 = ""
      let _monto = 0
      let _acuenta = 0
      let _resto = 0
      dientesvalue.filter((elem) => elem.diagnostico == hallazgo).forEach(item2 => {
        dientes = dientes + ((dientes == "") ? "" : ", ") + item2.diente;
      })
      itemodontograma.value.planTrata.filter((elem) => elem.hallazgo == hallazgo).forEach(itemh => {
        _monto = _monto + itemh.Tratamiento.reduce((precio, itemval) => {
          precio = precio + itemval.Precio
          return precio;
        }, 0);
      })
      itemodontograma.value.planTrata.filter((elem) => elem.hallazgo == hallazgo).forEach(itemh => {
        _acuenta = _acuenta + itemh.Tratamiento.reduce((precio, itemval) => {
          precio = precio + itemval.Acuenta
          return precio;
        }, 0);
      })

      let countCaries = itemodontograma.value.hallazgos.reduce((count, item1) => {
        if (item1.hallazgo === hallazgo) {
          count++;
        }
        return count;
      }, 0);
      groupedData[hallazgo] = [];
      Cie10.CIE10.filter((elem) => elem.HALLAZGO == hallazgo).forEach(item3 => {
        descie10 = item3.DECRICIE10;
        CIE10 = item3.CIE10;
      })
      descie10 = (descie10 == "") ? item.descripcion : descie10;
      CIE10 = (CIE10 == "") ? "K0--" : CIE10;
      groupedDataResumen.value.push({ diagnostico: descie10.toUpperCase(), cantidad: countCaries, dientes: dientes, CIE10: CIE10, monto: _monto, acuenta: _acuenta })
    }
  });
}
function NumFormatter(data) {
  return parseFloat(data).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function imprimirContenidoSeleccionado() {
  var botonCerrarCIE10 = document.getElementById('CerrarCIE10')
  window.print();
  botonCerrarCIE10?.click()
}
</script>

<template lang="pug">
.visita_guiada(v-if='visto == 0')
  img.cari(:style="`top: ${item2.top}; left: ${item2.left}; `" src='https://firebasestorage.googleapis.com/v0/b/quiru-b444f.appspot.com/o/Elementos%20ui%2FComponent_60_2_.webp?alt=media&token=603036f4-d6aa-45d4-9990-8d486ca38cdd')
  .burbuja(:style="`top: ${item2.topBurbuja}`")
    span {{item2.data}}
    .accionables
      btn.atras(v-if='indice!=0' @click='moverCarrusel(-1)')
        i.bi.bi-arrow-left-circle.fs-3
      btn.siguiente(v-if='indice != 4 ' @click="moverCarrusel(1)") 
        i.bi.bi-arrow-right-circle.fs-3
      btn.siguiente(v-else @click='finalizar()')
        i.bi.bi-arrow-right-circle.fs-3
    a.btn.align-self-start.light(@click='finalizar()') omitir

#id02.modal(style="display:none;")
  .modal-content.modal-sm
    .container
      p.modal-title Eliminar odontograma
      p ¿Esta seguro que desea eliminar?
      .clearfix
        button.btn.btn-secondary.cancelbtn(@click="Cancelar()") Cancelar
        button.btn.btn-danger.deletebtn(@click="EliminarOdonto(), mostrar = false") Aceptar
.scrollspy-example(data-bs-spy="scroll" data-bs-target="#list-example" data-bs-smooth-scroll="true" tabindex="0")
  h4(id="list-item-1") 
.row
  .col
    .row
      #alerta.alert.alert-danger.alert-dismissible(style='display:none') No hay nada que imprimir
        a.close(@click="Cancelar()" href='#' data-dismiss='alert' aria-label='close') &times;
      #alerto.alert.alert-danger.alert-dismissible(style='display:none') Cuidado! Este Odontograma tiene hallazgos registrados
        a.close(@click="Cancelar()" href='#' data-dismiss='alert') &times;
      .col
        #SeccionPrincipal
        ul.nav.nav-tabs( id="myTab" role="tablist")
          li.nav-item( role="presentation" v-if="itemodontograma?.idRelacionado")
            button.nav-link( 
              @click="push({name: 'Detalle', params: {idOdontograma: itemodontograma?.idRelacionado, idPaciente: route.params.idPaciente,tipoOdonto: 'Diagnóstico'} })"
            ) 
              strong.h2.fw-bold Diagnóstico
          li.nav-item()
            button.nav-link(
              :class='route.params.idOdontograma == itemodontograma?.id ? "active" : "" '
            ) 
              strong.h2.fw-bold {{itemodontograma?.tipo}}

          l1.nav-item( role="presentation" )
            button.nav-link( 
              v-for="idTratamientoHermano of idRelacionados_(itemodontograma?.id)"
              @click="push({name: 'Detalle', params: {idOdontograma: idTratamientoHermano, idPaciente: route.params.idPaciente,tipoOdonto: 'Tratamiento'} })"
            ) 
              strong.h2.fw-bold Tratamiento
    .row
      .col-2
        button.mb-2.btn(@click='push({ name: "pacienteVer", params: { idPaciente: route.params.idPaciente } })')       
          i.bi.bi-arrow-left(style="color: var(--color-primary); font-size: 35px" )
      .col-10
        .left
          button.btn(v-if="itemodontograma?.tipo === 'Tratamiento'" title='Borrar'  @click="CallConfirm2(itemodontograma)")
            i.bi.bi-trash.fs-3(style="color: var(--color-primary)")
          button.btn(title='Imprimir' @click="printOdontograma()")
            i.bi.bi-printer.fs-3(style="color: var(--color-primary)")#destacarImpresion
          a.btn(title='Ejemplos' href="#SeccionAyuda" @click='activarAyuda()')
            i.bi.bi-question-circle.fs-3(style="color: var(--color-primary)")#destacarAyuda

    Formulario
    .col.mt-1.justify-content.desplazable(style="display: none" id="AyudaCard")
      .col.item
        .card.card-body#SeccionAyuda
          Instrucciones

    .row.mb-5
      .col-lg-4.col-md-6.col-sm-6.col-xs-12
        div.opciones
          button.outline-quiru(style="margin-bottom: 1.8rem;" @click='push({ name: "adicionales", params: { idOdontograma: route.params.idOdontograma, idPaciente: route.params.idPaciente, tipoOdonto: itemodontograma.tipo } })' )
            .contenido(style="width: 60%;")
              .title Agregar
              .subtitle Datos adicionales
            i.bi.bi-file-earmark-plus.icono
      .col-lg-4.col-md-6.col-sm-6.col-xs-12 
        div.opciones
          button.outline-quiru(style="margin-bottom: 1.8rem;" @click='push({ name: "plantratamiento", params: { idOdontograma: route.params.idOdontograma, idPaciente: route.params.idPaciente, tipoOdonto: itemodontograma.tipo } })' )
            .contenido(style="width: 60%;")
              .title Generar
              .subtitle Plan de Tratamiento
            i.bi.bi-file-earmark-plus.icono 
      .col-lg-4.col-md-6.col-sm-6.col-xs-12 
        div.opciones
          button.outline-quiru(style="margin-bottom: 1.8rem;" data-bs-toggle='modal', data-bs-target='#tratamientosAtModal' @click="verDiagnostico()" )
            .contenido(style="width: 60%;")
              .title Resumen
              .subtitle Diagnóstico
            i.bi.bi-file-earmark-plus.icono   

  Teleport(to='body')
    #tratamientosAtModal.modal.fade(tabindex='-1')
      .modal-dialog.modal-xl
        .modal-content
          .modal-header
            .col-7.col-md-9
              h2.modal-title Resumen
              h4.my-0(style="color: var(--text-secondary); font-size: 1.1em") Diagnóstico
            button.btn-close(type='button' data-bs-dismiss='modal')
          .modal-body
            form
              .row.mb-3
                .card.resumen-tabla.summary-table-heading.d-none.d-md-block.mx-1
                  .row.p-1(style="color:var(--brand-navy);font-weight: bold;")
                    .col-1 CIE 10
                    .col-3 Diagnóstico
                    .col-2.text-center Cantidad
                    .col-2.text-center Piezas
                    .col-1.text-center Costo
                    .col-2.text-center A Cuenta
                    .col-1.text-center Resto
                .card.resumen-tabla.summary-row.mt-2.d-none.d-md-block(v-for="item of listaResumen")
                  .row.p-1.m-1         
                    .col-1 {{item.CIE10}}
                    .col-3 {{item.diagnostico}}
                    .col-2.text-center {{item.cantidad}}
                    .col-2.text-center {{item.dientes}}
                    .col-1.text-center {{item.monto}}
                    .col-2.text-center {{item.acuenta}}
                    .col-1.text-center {{item.monto - item.acuenta}}
                .card.resumen-movil.summary-row.mt-2.d-block.d-md-none(v-for="item of listaResumen")
                  .row.g-2.p-2
                    .col-4.summary-label CIE 10
                    .col-8 {{item.CIE10}}
                    .col-4.summary-label Diagnóstico
                    .col-8 {{item.diagnostico}}
                    .col-4.summary-label Cantidad
                    .col-8 {{item.cantidad}}
                    .col-4.summary-label Piezas
                    .col-8 {{item.dientes}}
                    .col-4.summary-label Costo
                    .col-8 {{item.monto}}
                    .col-4.summary-label A cuenta
                    .col-8 {{item.acuenta}}
                    .col-4.summary-label Resto
                    .col-8 {{item.monto - item.acuenta}}
          .modal-footer
            button.btn.btn-primary(type='button' @click='imprimirContenidoSeleccionado()') Imprimir
            button.btn.btn-secondary(type='button', data-bs-dismiss='modal' id="CerrarCIE10") Salir

</template>

<style lang="sass" scoped>
:root
  --cariTop: 0%
  --cariLeft: 0%
  --burbujaTop: 0%
  --burbujaLeft: 0%

.summary-table-heading
  color: var(--brand-navy)
  background: #eef4ff !important
  border: 1px solid var(--color-border)
  border-radius: 12px
  box-shadow: none
  font-weight: 700

.summary-row
  border: 1px solid var(--color-border)
  border-radius: 12px
  box-shadow: none
  transition: border-color .18s ease, background-color .18s ease
  &:hover
    border-color: rgba(var(--brand-blue-rgb), .28)
    background: #f7faff

.summary-label
  color: var(--text-secondary)
  font-size: .82rem
  font-weight: 700

.elevar
  position: relative
  z-index: 3 !important
.noElevar
  position: relative
  z-index: 0 !important
.visita_guiada
  margin: 0px
  padding: 0px
  display: flex
  position: absolute
  width: 100%
  height: 170%
  background-color: rgba(7, 27, 64, .82)
  z-index: 1
  left: 0 
  top: 0 
  .cari
    height: 140px !important
    display: flex
    opacity: 1
    width: 140px !important
    position: absolute
    z-index:6
    animation: cari 8s ease-in 0s infinite alternate forwards
  .burbuja
    display: flex
    flex-direction: column
    padding: 20px
    top: 40%
    left: 50%
    transform: translateX(-50%)
    width: 300px
    height: 160px
    background-color: var(--color-white)
    position: absolute
    z-index: 6
    border-radius: 20px
    &:before
      content: ""
      position: absolute
      bottom: -49px
      left: 30px
      width: 54px
      height: 50px
      background-color: var(--color-white)
      clip-path: polygon(100% 0, 0 0, 50% 100%)
    .accionables
      display: flex
      flex-direction: row
      justify-content: end
      position: absolute
      bottom: 10px
      right: 20px
      .atras, .siguiente
        color: var(--color-primary)

#id02 
  background-color: rgba(0, 0, 0, 0.6)
.cancelbtn,
.deletebtn 
  float: left 
  width: 50% 
.cancelbtn 
  background-color: rgb(189, 189, 189) 
.deletebtn 
  background-color: #f44336 
.container 
  padding: 16px 
  text-align: center 
#id02
  position: fixed 
  left: 0 
  top: 0 
  width: 100% 
  height: 100% 
  overflow: auto 
  opacity: 1 
  padding-top: 50px 
#id02 .modal-content 
  background-color: #fefefe 
  margin: 5% auto 15% auto 
  border: 1px solid #888 
  width: 80%
.clearfix 
  &::after 
    content: "" 
    clear: both 
    display: table 
.left
  display: flex
  justify-content: end
  align-items: center
.opciones
  margin-top: 16px
  margin-left: auto
  margin-right: auto
  display: flex
  flex-direction: column
  justify-content: center
  align-items: center
  width: 100%
  height: auto
  .outline-quiru
    width: 100%
    height: 75px
    border-radius: 14px
    border: 1px solid var(--color-primary)
    background-color: white
    display: flex
    flex-direction: row
    justify-content: space-around
    align-items: center
    &.solid
      background-color: var(--color-primary)
    &.disabled
      border: none
      background-color: gray
      
    .contenido
      display: flex
      flex-direction: column
      align-items: start
      justify-content: start
      width: 150px
      .title
        font-weight: 700
        color: var(--color-primary)

        &.light-quiru
          color: var(--color-white)
          background: transparent
      .subtitle
        font-weight: 400
        color: var(--color-primary)
        &.light-quiru
          color: var(--color-white)
    .icono
      font-size: 26px
      color: var(--color-primary)
      &.light-quiru
        color: var(--color-white)

@media (min-width: 800px)
  .opciones
    margin-top: 16px
    margin-left: auto
    margin-right: auto
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    width: 100%
    height: auto
  .visita_guiada
    margin: 0px
    padding: 0px
    display: flex
    position: absolute
    width: 100%
    height: 100%
    background-color: rgba(7, 27, 64, .82)
    z-index: 1
    left: 0 
    top: 0 
    .cari
      height: 140px !important
      display: flex
      opacity: 1
      width: 140px !important
      position: absolute
      top: 72% !important
      left: 78% !important
      z-index: 6
      animation: cari 8s ease-in 0s infinite alternate forwards
    .burbuja
      display: flex
      flex-direction: column
      padding: 20px
      top: 45% !important
      left: 78% !important
      width: 300px
      height: 160px
      background-color: var(--color-white)
      position: absolute
      z-index: 6
      border-radius: 20px
      &:before
        content: ""
        position: absolute
        bottom: -49px
        left: 190px
        width: 54px
        height: 50px
        background-color: var(--color-white)
        clip-path: polygon(100% 0, 0 0, 50% 100%)
      .accionables
        display: flex
        flex-direction: row
        justify-content: end
        position: absolute
        bottom: 10px
        right: 20px
        .atras, .siguiente
          color: var(--color-primary)

@media print
  :global(body > *:not(#tratamientosAtModal))
    display: none !important
  :global(body)
    margin: 0 !important
    background: white !important
  #tratamientosAtModal
    position: static !important
    display: block !important
    width: 100% !important
    height: auto !important
    overflow: visible !important
    padding: 0 !important
    opacity: 1 !important
    background: white !important
    -webkit-print-color-adjust: exact
    print-color-adjust: exact
    .modal-dialog
      width: 100% !important
      max-width: none !important
      margin: 0 !important
    .modal-content
      width: 100% !important
      margin: 0 !important
      border: 0 !important
      border-radius: 0 !important
      box-shadow: none !important
    .modal-body
      padding: 0.5rem 0 !important
    .btn-close,
    .modal-footer
      display: none !important
    .resumen-tabla
      display: block !important
      break-inside: avoid
      page-break-inside: avoid
    .resumen-movil
      display: none !important
    
@keyframes cari
  0%
    transform: translate(0)

  20%
    transform: translate(-4px, 4px)

  40%
    transform: translate(-4px, -4px)

  60%
    transform: translate(4px, 4px)

  80%
    transform: translate(4px, -4px)

  100%
    transform: translate(0)
</style>
