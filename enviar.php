<?php
/* =========================================================================
   EVEREST AIRES Y FRÍO — envío del formulario por correo (Hostinger)
   Para usarlo:
     1) Cambia $DESTINO por el correo que recibirá las solicitudes.
     2) En assets/js/config.js pon FORM_ENDPOINT: "enviar.php"
   Recomendado: crea en Hostinger un correo del mismo dominio
   (ej. web@everestairesyfrio.com) y úsalo en $REMITENTE para que los
   mensajes no lleguen a spam.
   ========================================================================= */

$DESTINO   = "PENDIENTE@everestairesyfrio.com";
$REMITENTE = "web@everestairesyfrio.com";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["ok" => false]);
  exit;
}

// Honeypot anti-spam: si viene lleno, respondemos OK sin enviar nada
if (!empty($_POST["sitio_web"])) {
  echo json_encode(["ok" => true]);
  exit;
}

function campo($nombre, $max = 1000) {
  $v = isset($_POST[$nombre]) ? trim((string) $_POST[$nombre]) : "";
  $v = str_replace(["\r", "\n"], " ", $v);
  return mb_substr(strip_tags($v), 0, $max);
}

$datos = [
  "Nombre"         => campo("nombre", 120),
  "Teléfono"       => campo("telefono", 40),
  "Correo"         => campo("correo", 160),
  "Servicio"       => campo("servicio", 120),
  "Tipo de equipo" => campo("tipo_equipo", 120),
  "Zona"           => campo("zona", 120),
  "Mensaje"        => isset($_POST["mensaje"]) ? mb_substr(strip_tags(trim($_POST["mensaje"])), 0, 3000) : "",
];

$telefono = preg_replace("/\D/", "", $datos["Teléfono"]);
if (mb_strlen($datos["Nombre"]) < 2 || strlen($telefono) < 10 || empty($_POST["acepta"])) {
  http_response_code(422);
  echo json_encode(["ok" => false, "error" => "Datos incompletos"]);
  exit;
}

$cuerpo = "Nueva solicitud desde la página web:\n\n";
foreach ($datos as $k => $v) {
  if ($v !== "") $cuerpo .= "$k: $v\n";
}
$cuerpo .= "\nAceptó el tratamiento de datos: sí\nFecha: " . date("Y-m-d H:i") . "\n";

$cabeceras  = "From: Everest Web <$REMITENTE>\r\n";
if (filter_var($datos["Correo"], FILTER_VALIDATE_EMAIL)) {
  $cabeceras .= "Reply-To: " . $datos["Correo"] . "\r\n";
}
$cabeceras .= "Content-Type: text/plain; charset=UTF-8\r\n";

$asunto = "=?UTF-8?B?" . base64_encode("Nueva solicitud web — " . $datos["Nombre"]) . "?=";
$ok = mail($DESTINO, $asunto, $cuerpo, $cabeceras);

http_response_code($ok ? 200 : 500);
echo json_encode(["ok" => $ok]);
