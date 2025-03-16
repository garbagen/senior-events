# Script para copiar archivos de programación a un único directorio, excluyendo multimedia y archivos grandes
# Uso: .\CopiarArchivosPlanos.ps1 -RutaOrigen "C:\TuProyecto" -RutaDestino "C:\CopiaDeSeguridad"

param (
    [Parameter(Mandatory=$true)]
    [string]$RutaOrigen,
    
    [Parameter(Mandatory=$true)]
    [string]$RutaDestino
)

# Crear la carpeta de destino si no existe
if (-not (Test-Path -Path $RutaDestino)) {
    New-Item -ItemType Directory -Path $RutaDestino -Force | Out-Null
    Write-Host "Carpeta de destino creada: $RutaDestino" -ForegroundColor Green
}

# Carpetas a excluir
$carpetasExcluidas = @(
    "node_modules",
    ".git",
    "bin",
    "obj",
    "dist",
    "build",
    ".vs",
    ".vscode",
    "packages",
    "vendor",
    "bower_components",
    ".idea",
    "coverage",
    "__pycache__",
    ".next",
    "out"
)

# Archivos específicos a excluir
$archivosExcluidos = @(
    "package-lock.json"
)

# Extensiones a excluir
$extensionesExcluidas = @(
    ".log",
    ".tmp",
    ".temp",
    ".bak",
    ".cache",
    ".DS_Store",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".mp4",
    ".mov",
    ".avi",
    ".wmv",
    ".webm",
    ".flv",
    ".mkv"
)

# Iniciar el contador
$copiados = 0
$duplicados = 0
$fallidos = 0

# Mostrar información de inicio
Write-Host "Iniciando copia de archivos..." -ForegroundColor Magenta
Write-Host "Origen: $RutaOrigen" -ForegroundColor White
Write-Host "Destino: $RutaDestino" -ForegroundColor White
Write-Host ""

# Crear un hashtable para rastrear nombres de archivos ya usados
$nombresUtilizados = @{}

# Crear un archivo de texto para guardar la estructura
$rutaEstructura = Join-Path -Path $RutaDestino -ChildPath "estructura_archivos.txt"
"Estructura de archivos de $RutaOrigen" | Out-File -FilePath $rutaEstructura
"Generado el $(Get-Date)" | Out-File -FilePath $rutaEstructura -Append
"" | Out-File -FilePath $rutaEstructura -Append

# Función para generar estructura de archivos
function Generar-Estructura {
    param (
        [string]$ruta,
        [int]$nivel = 0,
        [string]$rutaArchivo
    )
    
    $indentacion = "    " * $nivel
    $nombreCarpeta = Split-Path -Path $ruta -Leaf
    
    if ($nivel -eq 0) {
        "$indentacion$nombreCarpeta\" | Out-File -FilePath $rutaArchivo -Append
    } else {
        "$indentacion|-- $nombreCarpeta\" | Out-File -FilePath $rutaArchivo -Append
    }
    
    # Obtener carpetas ordenadas
    $carpetas = Get-ChildItem -Path $ruta -Directory | Sort-Object Name
    
    # Obtener archivos ordenados
    $archivos = Get-ChildItem -Path $ruta -File | Sort-Object Name
    
    # Procesar carpetas (excepto las excluidas)
    foreach ($carpeta in $carpetas) {
        if ($carpetasExcluidas -notcontains $carpeta.Name) {
            Generar-Estructura -ruta $carpeta.FullName -nivel ($nivel + 1) -rutaArchivo $rutaArchivo
        } else {
            "$indentacion|   |-- $($carpeta.Name)\ [EXCLUIDA]" | Out-File -FilePath $rutaArchivo -Append
        }
    }
    
    # Procesar archivos
    foreach ($archivo in $archivos) {
        $extension = [System.IO.Path]::GetExtension($archivo.Name)
        $excluido = $false
        
        if ($archivosExcluidos -contains $archivo.Name -or $extensionesExcluidas -contains $extension) {
            "$indentacion|   |-- $($archivo.Name) [EXCLUIDO]" | Out-File -FilePath $rutaArchivo -Append
            $excluido = $true
        } else {
            "$indentacion|   |-- $($archivo.Name)" | Out-File -FilePath $rutaArchivo -Append
        }
    }
}

# Generar la estructura de archivos
Write-Host "Generando estructura de archivos..." -ForegroundColor Cyan
Generar-Estructura -ruta $RutaOrigen -rutaArchivo $rutaEstructura
Write-Host "Estructura guardada en: $rutaEstructura" -ForegroundColor Green
Write-Host ""

# Obtener todos los archivos, excluyendo las carpetas y archivos no deseados
$archivos = Get-ChildItem -Path $RutaOrigen -Recurse -File | Where-Object {
    $excluir = $false
    
    # Verificar si está en carpeta excluida
    foreach ($carpeta in $carpetasExcluidas) {
        if ($_.FullName -like "*\$carpeta\*") {
            $excluir = $true
            break
        }
    }
    
    # Verificar si es un archivo específico excluido
    if (-not $excluir -and $archivosExcluidos -contains $_.Name) {
        $excluir = $true
    }
    
    # Verificar extensión excluida
    if (-not $excluir) {
        $extension = [System.IO.Path]::GetExtension($_.Name)
        if ($extensionesExcluidas -contains $extension) {
            $excluir = $true
        }
    }
    
    -not $excluir
}

$totalArchivos = $archivos.Count
Write-Host "Se encontraron $totalArchivos archivos para copiar" -ForegroundColor Cyan
Write-Host ""

# Copiar cada archivo
foreach ($archivo in $archivos) {
    $nombreOriginal = $archivo.Name
    $nombreDestino = $nombreOriginal
    $contador = 1
    
    # Verificar si ya existe un archivo con este nombre
    while ($nombresUtilizados.ContainsKey($nombreDestino)) {
        $extension = [System.IO.Path]::GetExtension($nombreOriginal)
        $nombreSinExt = [System.IO.Path]::GetFileNameWithoutExtension($nombreOriginal)
        $nombreDestino = "$nombreSinExt($contador)$extension"
        $contador++
        $duplicados++
    }
    
    # Marcar este nombre como utilizado
    $nombresUtilizados[$nombreDestino] = $true
    
    # Ruta completa de destino
    $rutaDestinacion = Join-Path -Path $RutaDestino -ChildPath $nombreDestino
    
    try {
        # Copiar el archivo
        Copy-Item -Path $archivo.FullName -Destination $rutaDestinacion -Force
        $copiados++
        Write-Host "Copiado: $($archivo.FullName) -> $rutaDestinacion" -ForegroundColor Green
    }
    catch {
        $fallidos++
        Write-Host "Error al copiar: $($archivo.FullName)" -ForegroundColor Red
        Write-Host "  Mensaje: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Mostrar progreso
    $porcentaje = [math]::Round(($copiados / $totalArchivos) * 100)
    Write-Progress -Activity "Copiando archivos" -Status "$copiados de $totalArchivos ($porcentaje%)" -PercentComplete $porcentaje
}

# Mostrar resumen
Write-Host ""
Write-Host "Proceso completado" -ForegroundColor Green
Write-Host "Total de archivos encontrados: $totalArchivos" -ForegroundColor Cyan
Write-Host "Archivos copiados correctamente: $copiados" -ForegroundColor Green
Write-Host "Archivos con nombres duplicados: $duplicados" -ForegroundColor Yellow
Write-Host "Archivos con errores: $fallidos" -ForegroundColor Red
Write-Host ""
Write-Host "Los archivos se han copiado en: $RutaDestino" -ForegroundColor White
Write-Host "La estructura de archivos se ha guardado en: $rutaEstructura" -ForegroundColor White