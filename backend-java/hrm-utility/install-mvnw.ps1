# PowerShell helper to install the Maven binary distribution used by the wrapper
param()
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$wrapperDir = Join-Path $root ".mvn\wrapper"
New-Item -ItemType Directory -Force -Path $wrapperDir | Out-Null
$propsPath = Join-Path $wrapperDir "maven-wrapper.properties"
$props = "distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.4/apache-maven-3.9.4-bin.zip"
Set-Content -Path $propsPath -Value $props -Encoding UTF8
$distUrl = 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.4/apache-maven-3.9.4-bin.zip'
$zipPath = Join-Path $wrapperDir 'maven-dist.zip'
if (!(Test-Path (Join-Path $wrapperDir 'apache-maven\bin\mvn.cmd'))) {
    Write-Host "Downloading Apache Maven..."
    Invoke-WebRequest -Uri $distUrl -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $wrapperDir -Force
    Remove-Item -Force $zipPath
    # move extracted apache-maven-* to apache-maven
    $ex = Get-ChildItem -Path $wrapperDir -Directory | Where-Object { $_.Name -like 'apache-maven*' } | Select-Object -First 1
    if ($ex) {
        $target = Join-Path $wrapperDir 'apache-maven'
        if (Test-Path $target) { Remove-Item -Recurse -Force $target }
        Move-Item -Path $ex.FullName -Destination $target
    }
}
# ensure mvnw has execute flag on Unix systems
$mvnw = Join-Path $root "mvnw"
if (Test-Path $mvnw) {
    try { chmod +x $mvnw } catch {}
}
Write-Host "Maven binary installed in $wrapperDir\apache-maven; use .\mvnw.cmd spring-boot:run or .\mvnw spring-boot:run"
