import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TermsScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Términos y Condiciones</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>CONTRATO DE ADHESIÓN PARA LA VENTA Y COMPRA EN CUOTAS</Text>
                <Text style={styles.subtitle}>(EL PROGRAMA DE COMPRA EN CUOTAS MAMASAN)</Text>

                <Text style={styles.paragraph}>
                    Estos términos y condiciones para la ejecución de EL PROGRAMA DE COMPRA EN CUOTAS MAMASAN constituyen un contrato de adhesión que se celebra entre los Clientes y MAMASAN, quienes expresamente manifiestan su consentimiento y la aceptación de las condiciones de EL PROGRAMA.
                </Text>
                <Text style={styles.paragraph}>
                    MAMASAN es la marca y plataforma digital que gestiona este programa y sus derechos corresponden a la sociedad mercantil Emprendimiento Jaime Molina 2 (denominada en adelante “La Empresa”), para hacer ofertas de venta de productos, bienes y servicios provenientes de tiendas internacionales (como Amazon, Shein, Walmart, y otros sitios de ecommerce), cuyo precio será pagado por los compradores a través de cuotas periódicas y sucesivas, hasta completar el precio final de venta.
                </Text>

                <Text style={styles.sectionHeader}>PRIMERA: OBJETO</Text>
                <Text style={styles.paragraph}>
                    Establecer las condiciones y términos bajo las cuales los Clientes aceptan la oferta de venta, compra y entrega de bienes y/o servicios adquiridos a través de la plataforma de Mamasan, abonando el precio acordado mediante una Cuota Inicial y posteriores Cuotas de Pago, con sujeción al Límite de Financiamiento y el Nivel de Categoría asignado.
                </Text>

                <Text style={styles.sectionHeader}>SEGUNDA: DEFINICIONES</Text>
                <Text style={styles.boldText}>MAMASAN</Text>
                <Text style={styles.paragraph}>
                    Marca propiedad de La Empresa, sociedad mercantil que gestiona, administra y supervisa EL PROGRAMA DE COMPRA EN CUOTAS MAMASAN a través de una plataforma digital. Está encargada de la compra de productos en el extranjero, la administración de la compra financiada y los pagos, la logística de entrega de los bienes y/o la gestión de los servicios.
                </Text>
                <Text style={styles.boldText}>EL PROGRAMA</Text>
                <Text style={styles.paragraph}>
                    Constituye el negocio jurídico de venta de productos, bienes o servicios ofrecidos por tiendas internacionales, donde MAMASAN adelanta la compra y acuerda el pago en cuotas a los compradores (Clientes), quienes pagan mediante una Cuota Inicial y Cuotas de Pago periódicas.
                </Text>
                <Text style={styles.boldText}>CLIENTE</Text>
                <Text style={styles.paragraph}>
                    Es toda aquella persona natural o jurídica que cumple con los requisitos exigidos, manifiesta su consentimiento para participar como comprador, y acepta el precio, la compra financiada y las condiciones de pago fraccionado de las ofertas de productos gestionadas por MAMASAN.
                </Text>
                <Text style={styles.boldText}>Cuota Inicial</Text>
                <Text style={styles.paragraph}>
                    Suma de dinero que deberá pagarse a MAMASAN al momento del perfeccionamiento del contrato. Corresponde al monto inicial de la compra y el sistema la calculará en base a las características del carrito de compra. Esta cuota se entiende causada cuando el Cliente acepta participar en el PROGRAMA.
                </Text>
                <Text style={styles.boldText}>Cuotas de Pago</Text>
                <Text style={styles.paragraph}>
                    Son las fracciones en las que las partes acuerdan será dividido el monto restante del precio de venta (saldo adeudado). El pago de estas cuotas será periódico, de acuerdo con la frecuencia y el número de cuotas (4, 6 o más) asignadas según el Nivel de Categoría del Cliente.
                </Text>
                <Text style={styles.boldText}>Fecha de Vencimiento</Text>
                <Text style={styles.paragraph}>
                    Es la fecha en la que vence la cuota.
                </Text>
                <Text style={styles.boldText}>Período de Gracia</Text>
                <Text style={styles.paragraph}>
                    Es el plazo de dos (2) días calendario posteriores a la Fecha de Vencimiento, que el Cliente tiene para cumplir con su obligación de pago, antes de entrar en estado de retraso o mora.
                </Text>
                <Text style={styles.boldText}>Nivel de Categoría</Text>
                <Text style={styles.paragraph}>
                    Sistema de clasificación (Bronce, Plata, Oro, Platino) que determina el Límite de Financiamiento máximo y el número de Cuotas de Pago disponibles para el Cliente.
                </Text>
                <Text style={styles.boldText}>Límite de Financiamiento</Text>
                <Text style={styles.paragraph}>
                    Monto máximo de compra financiada que MAMASAN asigna a un Cliente, el cual está determinado por su Nivel de Categoría y su historial de pago.
                </Text>
                <Text style={styles.boldText}>Pago Puntual</Text>
                <Text style={styles.paragraph}>
                    Cumplimiento del pago de las Cuotas de Pago dentro del plazo establecido en este contrato. Es la condición necesaria para ascender o mantener el Nivel de Categoría.
                </Text>

                <Text style={styles.sectionHeader}>TERCERA: NATURALEZA DEL CONTRATO</Text>
                <Text style={styles.paragraph}>
                    Estos términos y condiciones constituyen un contrato de adhesión que se celebra entre los Clientes y MAMASAN, y se comprometen a cumplir con las condiciones de compra, pago y entrega de bienes en el marco de EL PROGRAMA.
                </Text>

                <Text style={styles.sectionHeader}>CUARTA: PERFECCIONAMIENTO DEL CONTRATO</Text>
                <Text style={styles.paragraph}>
                    4.1. El presente contrato es de adhesión y se perfecciona al momento de la aceptación de las cláusulas aquí descritas (de manera escrita, verbal, o a través de cualquier otro medio idóneo susceptible de ser reproducido como lo puede ser un mensaje de datos), y el pago de la Cuota Inicial de acuerdo con el plan escogido.
                </Text>
                <Text style={styles.paragraph}>
                    4.2. Admisión al PROGRAMA. La vinculación al PROGRAMA requiere la aceptación previa de MAMASAN luego de un estudio de capacidad de pago y la verificación de los requisitos de perfeccionamiento.
                </Text>

                <Text style={styles.sectionHeader}>QUINTA: DERECHOS Y OBLIGACIONES DE LAS PARTES</Text>
                <Text style={styles.boldText}>5.1. DERECHOS Y OBLIGACIONES DEL CLIENTE:</Text>
                <Text style={styles.paragraph}>
                    Derecho: Recibir los bienes y/o servicios que hayan pagado de conformidad con los términos de EL PROGRAMA y lo pautado en el presente contrato.
                </Text>
                <Text style={styles.paragraph}>
                    Obligación: Cumplir con el pago de la Cuota Inicial y las Cuotas de Pago en las condiciones, montos y plazos acordados con MAMASAN.
                </Text>
                <Text style={styles.paragraph}>
                    Obligación: Pagar los impuestos que correspondan según la normativa fiscal venezolana relacionados a la compra del bien, producto o servicio entregado.
                </Text>
                <Text style={styles.boldText}>5.2. DERECHOS Y OBLIGACIONES DE MAMASAN:</Text>
                <Text style={styles.paragraph}>
                    Derecho: Recibir las cantidades de dinero por concepto de Cuota Inicial y Cuotas de Pago en los términos que hayan sido acordados previamente.
                </Text>
                <Text style={styles.paragraph}>
                    Obligación: Comprar el bien o servicio en la tienda internacional seleccionada y gestionar la logística hasta la entrega final al Cliente.
                </Text>
                <Text style={styles.paragraph}>
                    Obligación: Entregar los bienes, productos y/o servicios de acuerdo a lo acordado con los Clientes una vez que estos hayan cumplido con las Cuotas de Pago según las condiciones acordadas previamente con MAMASAN.
                </Text>
                <Text style={styles.paragraph}>
                    Obligación: Resguardar la confidencialidad y privacidad de la información suministrada por los Clientes.
                </Text>

                <Text style={styles.sectionHeader}>SEXTA: PAGO DE LOS BIENES, PRODUCTOS O SERVICIOS</Text>
                <Text style={styles.paragraph}>
                    6.1. Los Clientes están obligados a cumplir con el pago de las cuotas de acuerdo al PROGRAMA acordado con MAMASAN, para ser acreedores del derecho de entrega de los bienes productos o servicios.
                </Text>
                <Text style={styles.paragraph}>
                    6.2. Plazo de Pago y Período de Gracia. La Fecha de Vencimiento es la fecha que vence la cuota. El Cliente tendrá un Período de Gracia de dos (2) días calendario siguientes a la Fecha de Vencimiento para cumplir con su obligación de pago. Posteriormente, el Cliente entrará en estado de retraso o mora.
                </Text>
                <Text style={styles.paragraph}>
                    6.3. Penalidades por Atraso. En cualquier supuesto en que un Cliente se encuentre en mora de pago de una o varias cuotas, deberá pagar una penalidad. El monto de esta penalidad será de cuatro dólares de los Estados Unidos de América (USD 4,00) imputable a cada cuota en mora o retraso.
                </Text>

                <Text style={styles.sectionHeader}>SÉPTIMA: DEVOLUCIONES DE DINERO Y CANCELACIÓN POR INCUMPLIMIENTO</Text>
                <Text style={styles.paragraph}>
                    7.1. Solicitud de Devolución a Instancia del Cliente (No en Mora). En caso de que el Cliente solicite la devolución de los montos abonados antes de la entrega del bien, no deberá encontrarse en estado de mora o retraso. Se aplicará una penalidad del treinta y cinco por ciento (35%) del monto abonado.
                </Text>
                <Text style={styles.paragraph}>
                    7.2. Devolución por Mora del Cliente. En caso de que el Cliente solicite la devolución de los montos abonados y se encuentre en estado de mora o retraso, se le restará la penalidad de cuatro dólares de los Estados Unidos de América (USD 4,00) por cada cuota en mora, menos el treinta y cinco por ciento (35%) del monto abonado por concepto de penalidad general.
                </Text>
                <Text style={styles.paragraph}>
                    7.3. Cancelación del Pedido por Falta de Pago.
                </Text>
                <Text style={styles.paragraph}>
                    * Atraso en Cuotas Intermedias: El Cliente tendrá un plazo para pagar hasta la Fecha de Vencimiento de la próxima cuota pendiente. En el caso de que el Cliente no efectúe el pago en ese plazo extendido, MAMASAN procederá a la cancelación de la compra y a realizar la devolución del dinero abonado, aplicando la penalidad correspondiente y descontando los gastos asociados a la gestión de la compra.
                </Text>
                <Text style={styles.paragraph}>
                    * Atraso en la Última Cuota: Si el atraso se presenta en la última cuota, el Cliente tendrá siete (7) días calendario a partir de la Fecha de Vencimiento de dicha cuota para realizar el pago. De lo contrario, MAMASAN procederá a la cancelación del pedido y a la devolución del dinero con la aplicación de las penalidades y gastos correspondientes.
                </Text>

                <Text style={styles.sectionHeader}>OCTAVA: NIVELES DE CATEGORÍA Y BENEFICIOS</Text>
                <Text style={styles.paragraph}>
                    El PROGRAMA se basa en un sistema de cuatro (4) niveles que determinan el Límite de Financiamiento y las opciones de Cuotas de Pago disponibles para el Cliente. El ascenso de nivel se logra mediante el historial de Pago Puntual en las compras realizadas:
                </Text>

                <View style={styles.tableContainer}>
                    <Text style={styles.tableHeader}>1. Bronce 🥉</Text>
                    <Text style={styles.tableText}>Requisito: N/A (Todos los nuevos Clientes)</Text>
                    <Text style={styles.tableText}>Límite: Hasta $100,00</Text>
                    <Text style={styles.tableText}>Cuotas: 4 fijas</Text>

                    <Text style={styles.tableHeader}>2. Plata 🥈</Text>
                    <Text style={styles.tableText}>Requisito: 3 compras con Pago Puntual</Text>
                    <Text style={styles.tableText}>Límite: Hasta $300,00</Text>
                    <Text style={styles.tableText}>Cuotas: 4 fijas</Text>

                    <Text style={styles.tableHeader}>3. Oro 🥇</Text>
                    <Text style={styles.tableText}>Requisito: 6 compras con Pago Puntual</Text>
                    <Text style={styles.tableText}>Límite: Hasta $500,00</Text>
                    <Text style={styles.tableText}>Cuotas: 4 fijas</Text>

                    <Text style={styles.tableHeader}>4. Platino 💎</Text>
                    <Text style={styles.tableText}>Requisito: 12 compras con Pago Puntual</Text>
                    <Text style={styles.tableText}>Límite: A partir de $501,00</Text>
                    <Text style={styles.tableText}>Cuotas: 6 o más</Text>
                    <Text style={styles.tableText}>Beneficios: Atención prioritaria y descuentos</Text>
                </View>

                <Text style={styles.boldText}>8.1. Descenso de Nivel por Atraso.</Text>
                <Text style={styles.paragraph}>
                    El mantenimiento del nivel de categoría está estrictamente ligado al cumplimiento del Pago Puntual. El incumplimiento resultará en la aplicación de las siguientes penalidades de nivel, evaluadas en un período de seis (6) meses:
                </Text>
                <Text style={styles.paragraph}>
                    Tercer (3er) Atraso: Al acumular el tercer atraso en el pago de las cuotas dentro de un período de seis (6) meses, el Cliente descenderá un (1) nivel de categoría inmediatamente.
                </Text>
                <Text style={styles.paragraph}>
                    Cuarto (4to) Atraso: Al acumular el cuarto atraso en el pago de las cuotas dentro de un período de seis (6) meses, el Cliente descenderá de forma inmediata al Nivel 1 (Bronce) y perderá todos los beneficios asociados a su categoría anterior.
                </Text>

                <Text style={styles.sectionHeader}>NOVENA: GARANTÍA Y RESPONSABILIDAD POR DEFECTOS</Text>
                <Text style={styles.paragraph}>
                    9.1. Responsabilidad por Logística. MAMASAN se hace responsable de evaluar y responder por los daños que sean resultado directo del mal manejo de la carga y la logística bajo su control.
                </Text>
                <Text style={styles.paragraph}>
                    9.2. Defectos del Marketplace. En caso de que el producto presente un defecto ligado al Marketplace principal (Amazon, Shein, Walmart, u otros sitios de ecommerce), MAMASAN podrá asistir al Cliente en la gestión de la reclamación o devolución ante dicho Marketplace, pero esto podrá generar costos de gestión adicionales que correrán por cuenta del Cliente.
                </Text>
                <Text style={styles.paragraph}>
                    9.3. Costos de Garantía. Cualquier costo asociado a la ejecución de una garantía, sea por defecto de fábrica, gestión de devolución o cualquier otro concepto de garantía del producto, será cubierto por el Cliente.
                </Text>

                <Text style={styles.sectionHeader}>DÉCIMA: ARTÍCULOS PROHIBIDOS</Text>
                <Text style={styles.paragraph}>
                    El Cliente se compromete a no incluir en sus órdenes a través de EL PROGRAMA ninguno de los siguientes artículos, cuya importación está prohibida o restringida por la aduana venezolana. La violación de esta cláusula es responsabilidad exclusiva del Cliente:
                </Text>
                <Text style={styles.paragraph}>
                    ❌ Vappers o cigarrillos electrónicos.
                    {"\n"}❌ Antenas Starlink.
                    {"\n"}❌ Equipos electrónicos usados o reconstruidos, refurbished.
                    {"\n"}❌ Equipos de minado de Bitcoin.
                    {"\n"}❌ Máscaras antigás, Cascos, escudos, chalecos antibalas.
                    {"\n"}❌ Todo tipo de armas de fuego y accesorios relacionados.
                    {"\n"}❌ Pistolas de paintball, municiones y accesorios.
                    {"\n"}❌ Pistolas de aire comprimido, municiones y accesorios.
                    {"\n"}❌ Drones.
                    {"\n"}❌ Resorteras o tirachinas.
                    {"\n"}❌ Perfumes (no más de dos por envío).
                    {"\n"}❌ Prendas de oro (no más de dos por envío).
                    {"\n"}❌ Artículos o implementos de laboratorio.
                    {"\n"}❌ Químicos.
                    {"\n"}❌ Licores.
                    {"\n"}❌ Aceites de motor, Lubricantes, aditivos, refrigerantes.
                    {"\n"}❌ Ballestas y municiones relacionadas.
                    {"\n"}❌ Miras telescópicas.
                    {"\n"}❌ Plomo de pescar.
                    {"\n"}❌ Gas pimienta.
                    {"\n"}❌ Armas eléctricas (Tasers y sus variantes).
                    {"\n"}❌ Bolas de Rodillo y rodamientos de bola de caucho o metálicas.
                    {"\n"}❌ Canicas de cualquier tipo y material.
                    {"\n"}❌ Cuchillos o navajas de cualquier tipo o clase.
                    {"\n"}❌ Equipos militares.
                    {"\n"}❌ Artículos y equipos de camuflaje.
                    {"\n"}❌ Máscaras de esquí.
                    {"\n"}❌ Pelotas de golf.
                    {"\n"}❌ Teléfonos satelitales.
                    {"\n"}❌ Walkie talkies o radios de 2 vías.
                    {"\n"}❌ Artículos deportivos de protección.
                    {"\n"}❌ Pelotas de béisbol.
                    {"\n"}❌ Bates de béisbol.
                    {"\n"}❌ Binoculares.
                    {"\n"}❌ Megáfonos.
                </Text>

                <Text style={styles.sectionHeader}>DÉCIMA SÉPTIMA: NOTIFICACIONES Y RECLAMOS</Text>
                <Text style={styles.paragraph}>
                    Las notificaciones y comunicaciones entre las partes identificadas y que intervienen en EL PROGRAMA se realizarán por las siguientes vías: whatsApp o correo electrónico suministrados por el Cliente y utilizados por MAMASAN para la ejecución de este contrato.
                </Text>
                <Text style={styles.paragraph}>
                    Para cualquier consulta o reclamo relacionada con los presentes Términos y Condiciones, los Clientes podrán contactar a MAMASAN a través del servicio de Atención al Cliente.
                </Text>

                <Text style={styles.sectionHeader}>DÉCIMA OCTAVA: JURISDICCIÓN</Text>
                <Text style={styles.paragraph}>
                    Cualquier controversia derivada de este contrato será resuelta por los tribunales de la ciudad de Caracas, República Bolivariana de Venezuela, jurisdicción a la que las partes de este contrato reconocen sus competencia y fuero, con exclusión de cualquier otro.
                </Text>

                <Text style={styles.sectionHeader}>DÉCIMA NOVENA: DECLARATORIA DE ACEPTACIÓN POR LAS PARTES</Text>
                <Text style={styles.paragraph}>
                    La aceptación de este contrato por parte del representante de MAMASAN y los Clientes implica su acuerdo con todos los términos y condiciones establecidos en el mismo.
                </Text>

                <Text style={styles.footer}>Fecha de última actualización: 30/10/2025.</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#333',
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 10,
        color: '#444',
        textAlign: 'justify',
    },
    boldText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 5,
        marginBottom: 2,
        color: '#333',
    },
    tableContainer: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
    },
    tableHeader: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: '#FF007F',
    },
    tableText: {
        fontSize: 14,
        marginLeft: 10,
        marginBottom: 2,
        color: '#555',
    },
    footer: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 30,
        fontStyle: 'italic',
    },
});

export default TermsScreen;
