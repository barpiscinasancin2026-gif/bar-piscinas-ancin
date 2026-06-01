const API_URL = "https://script.google.com/macros/s/AKfycbwYb0WqvlluJRPSS2CoHnMjy823R5agKcSJZgTaKCuarOW3SwSRAz6bfPyQvNKzN7QL8Q/exec";

document.addEventListener("DOMContentLoaded", () => {
    const contenedorMenu = document.getElementById("contenedor-menu");
    const formReserva = document.getElementById("formulario-reserva");

    if (contenedorMenu) cargarMenu(contenedorMenu);
    if (formReserva) formReserva.addEventListener("submit", manejarReserva);
});

// Sistema de Notificaciones (Toasts)
function mostrarToast(mensaje, tipo = 'exito') {
    let contenedor = document.getElementById('toast-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toast-container';
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <span class="toast-icono">${tipo === 'exito' ? '✓' : '⚠'}</span>
        <span class="toast-mensaje">${mensaje}</span>
    `;

    contenedor.appendChild(toast);

    // Animación de entrada y salida
    requestAnimationFrame(() => toast.classList.add('mostrar'));
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 300); // Esperar a que termine la transición
    }, 4000);
}

// Generador de Esqueletos de Carga
function inyectarSkeletons(contenedor) {
    contenedor.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        contenedor.innerHTML += `
            <div class="skeleton-item">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-desc"></div>
            </div>
        `;
    }
}

async function cargarMenu(contenedor) {
    inyectarSkeletons(contenedor); // Mostrar carga profesional

    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error("Fallo de red");
        const datos = await respuesta.json();
        
        contenedor.innerHTML = ""; 
        
        const menuAgrupado = datos.reduce((acc, obj) => {
            if (!acc[obj.categoria]) acc[obj.categoria] = [];
            acc[obj.categoria].push(obj);
            return acc;
        }, {});
        
        for (const [categoria, productos] of Object.entries(menuAgrupado)) {
            const divCategoria = document.createElement("div");
            divCategoria.className = "categoria-seccion";
            divCategoria.innerHTML = `<h3 class="titulo-categoria">${categoria}</h3>`;
            
            productos.forEach(prod => {
                if(prod.visible) {
                    const htmlDescripcion = (prod.descripcion && prod.descripcion.trim() !== "") 
                        ? `<p class="descripcion-prod">${prod.descripcion}</p>` : '';

                    divCategoria.innerHTML += `
                        <div class="producto-contenedor">
                            <div class="producto-fila-principal">
                                <span class="nombre-prod">${prod.nombre}</span>
                                <span class="separador-puntos"></span>
                                <span class="precio-prod">${parseFloat(prod.precio).toFixed(2)} €</span>
                            </div>
                            ${htmlDescripcion}
                        </div>
                    `;
                }
            });
            contenedor.appendChild(divCategoria);
        }
    } catch (error) {
        contenedor.innerHTML = "<p class='error-estado'>El servicio no está disponible temporalmente.</p>";
        mostrarToast('Error al conectar con cocina.', 'error');
    }
}

async function manejarReserva(e) {
    e.preventDefault(); 
    const boton = document.getElementById("btn-submit");
    
    const datosReserva = {
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        comensales: parseInt(document.getElementById("comensales").value),
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        comentarios: document.getElementById("comentarios").value.trim()
    };

    boton.disabled = true;
    boton.innerHTML = '<span class="spinner"></span> Procesando...';
    
    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(datosReserva)
        });
        
        const resultado = await respuesta.json();
        
        if(resultado.status === "exito") {
            mostrarToast(`Reserva confirmada (Ref: ${resultado.id})`, 'exito');
            e.target.reset(); 
        } else {
            mostrarToast(`Error: ${resultado.mensaje}`, 'error');
        }
    } catch (error) {
        mostrarToast('Fallo de conexión. Revisa tu red.', 'error');
    } finally {
        boton.disabled = false;
        boton.innerHTML = "Solicitar Reserva";
    }
}