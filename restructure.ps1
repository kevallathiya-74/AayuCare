$ErrorActionPreference = 'Stop'

# 1. Create target directories
$base = "D:\Keval\AayuCare\.agents"
New-Item -ItemType Directory -Force -Path $base\ecc | Out-Null
New-Item -ItemType Directory -Force -Path $base\agency-agents | Out-Null
New-Item -ItemType Directory -Force -Path $base\impeccable | Out-Null
New-Item -ItemType Directory -Force -Path $base\vercel-skills | Out-Null

Write-Host "Created base directories."

# Helper function to move and deduplicate
function Move-Skill {
    param([string]$SourceDir, [string]$TargetBase)
    
    if (Test-Path $SourceDir) {
        $items = Get-ChildItem -Path $SourceDir -Directory
        foreach ($item in $items) {
            $targetPath = Join-Path $TargetBase $item.Name
            if (Test-Path $targetPath) {
                Write-Host "Duplicate found and ignored: $($item.Name)"
            } else {
                Move-Item -Path $item.FullName -Destination $targetPath -Force
                Write-Host "Moved: $($item.Name) to $TargetBase"
            }
        }
    }
}

# 2. Move Impeccable
$impeccableSource = "D:\Keval\AayuCare\.agent\project-skills\design\impeccable"
if (Test-Path $impeccableSource) {
    Move-Item -Path $impeccableSource -Destination "$base\impeccable\impeccable" -Force
    Write-Host "Moved Impeccable skill."
}

# 3. Move Vercel Skills
$vercelSource = "D:\Keval\AayuCare\.agent\project-skills\frontend"
if (Test-Path $vercelSource) {
    $vercelSkills = Get-ChildItem -Path $vercelSource -Directory -Filter "vercel-*"
    foreach ($vs in $vercelSkills) {
        Move-Item -Path $vs.FullName -Destination "$base\vercel-skills\$($vs.Name)" -Force
        Write-Host "Moved Vercel skill: $($vs.Name)"
    }
}

# 4. Move ECC Skills
Move-Skill -SourceDir "D:\Keval\AayuCare\.agent\skills" -TargetBase "$base\ecc"
Move-Skill -SourceDir "D:\Keval\AayuCare\.agent\.agents\skills" -TargetBase "$base\ecc"

Write-Host "Skills successfully moved and deduplicated."
