diumaro: Actua como un experto en programación de aplicaciones web, realiza un formulario en html para obtener información de un suministro a barco, para posteriormente enviar estos datos en un archivo json a una api creada por el ERP libra, que funciona sobre una BD Oracle, tienes que tener en cuenta para el diseño las imagenes  de los archivos (vivanta.jpeg y vivanta2.jpeg).

El formulario debe tener la siguiente estructura:

Titulo:  Suministro a Buques
Bloque 1 ( DATOS INICIALES)
campos:
codigo_empresa  VARCHAR2(5)
codigo_cliente  VARCHAR2(15)
nombre_cliente VARCHAR2(40)
nombre del barco VARCHAR2(100)
imo VARCHAR2(30)
Puerto suministro  VARCHAR2(20)
Puerto habilitado VARCHAR2(20)
Fecha de suministro DATE
consignatario/agente VARCHAR2(15)
telefono contacto VARCHAR2(20)
email VARCHAR2(100)

Bloque 2 (PRODUCTOS A SUMINISTRAR)
campos en una tabla con:
numero_linea  NUMBER
codigo_articulo VARCHAR2(30)
nombre VARCHAR2(100)
envase  NUMBER
unidades NUMBER

Bloque 3 (SERVICIOS NECESARIOS)
campos tipo check:
transporte  VARCHAR2(1)
bombeo  VARCHAR2(1)
despacho  VARCHAR2(1)

Bloque 4 (CONDICIONES DE VENTA)
campos en una tabla de ocho registros con estas columnas:
concepto  VARCHAR2(50)
importe number
aplica  VARCHAR2(1)   -  tipo check
- los valores del campo concepto para los ocho registros son los siguientes:
Descuento sobre pvp
Portes directos
Portes a puesto habilitado
Portes ultima milla
Costes bombeo
Tasas Portuarias
Despacho Mercancia
Otros Gastos

Temas a considerar:
- El  puerto habilitado se debe escoger de una ventana modal con una tabla similar a la que aparece en el archivo ( puertos.htm)


-- conexion al Nas para arrancar el servidor.

ssh -p 8822 admin@192.168.1.35
password:  nOYYyOWP6OM8
node ~/suministro-app/server.js