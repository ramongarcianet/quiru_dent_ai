<script setup>
import { listaDeHallazgos } from '../../config/Parametros';
$(document).ready(function () {
  $("#myInput").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#myTable tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });
  });
});

function ocultarAyuda() {
  var verAyuda = document.getElementById("AyudaCard");
  verAyuda.style.display = "none"

}
</script>

<template lang="pug">
.row
  .col-11
    input#myInput.form-control.parpadea(style='border-color: var(--color-border);' type='text' placeholder='Escriba una palabra para buscar en la lista el hallazgos')
  .col-1.p-0
    a(href='#SeccionPrincipal' style="color: black; cursor: default" id="act1" @click="ocultarAyuda()")
      i.bi.bi-x-lg.fs-3(style="margin-top: 5px; margin-left: 10px")
span.m-1(style='font-weight: bold; font-size: 12px; color:var(--brand-navy)') Pruebe diciendo un ejemplo, QUIRU Dent AI está escuchando
.Contenido.help-list
  table.table.help-table
    thead(style='position: sticky;top: 0')
      tr(style='background-color: white;')
        th.Cabecera Ejemplos de voz
        th.d-none.d-md-table-cell.Cabecera Norma técnica
    tbody#myTable.table-body
      tr(v-for='item of listaDeHallazgos.filter((elem) => elem.label != "")' :key='item.text' :item='item')
        td(v-if=' item.esDirecto === "SI" ') {{ item.orden +' '+ item.text }}
        td(v-else) {{ item.orden +' '+ item.text + ' '+ 'oclusal' }}
        td.d-none.d-md-table-cell {{ item.Especificacion }}

</template>

<style scoped>
.parpadea {

  animation-name: parpadeo;
  animation-duration: 1s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;

  -webkit-animation-name: parpadeo;
  -webkit-animation-duration: 1s;
  -webkit-animation-timing-function: linear;
  -webkit-animation-iteration-count: infinite;
}

@-moz-keyframes parpadeo {
  0% {
    opacity: 1.0;
  }

  50% {
    opacity: 0.0;
  }

  100% {
    opacity: 1.0;
  }
}

@-webkit-keyframes parpadeo {
  0% {
    opacity: 1.0;
  }

  50% {
    opacity: 0.0;
  }

  100% {
    opacity: 1.0;
  }
}

@keyframes parpadeo {
  0% {
    opacity: 1.0;
  }

  50% {
    opacity: 0.0;
  }

  100% {
    opacity: 1.0;
  }
}

.Cabecera {
  position: sticky;
  top: 0;
}

.Contenido {
  width: 100%;
  height: 300px;
  overflow: auto;
}

.help-list {
  margin-top: .5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: white;
}

.help-table {
  margin: 0;
  color: var(--brand-navy);
}

.help-table thead,
.help-table thead tr,
.help-table thead th {
  background: #eef4ff !important;
}

.help-table th,
.help-table td {
  padding: .7rem .85rem;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.help-table tbody tr:last-child td {
  border-bottom: 0;
}

.help-table tbody tr:hover {
  background: #f7faff;
}
</style>
