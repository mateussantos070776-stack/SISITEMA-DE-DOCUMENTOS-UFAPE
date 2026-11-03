import os

bat_content = """@echo off
for /L %%i in (201,1,400) do (
    mkdir "%%i"
)
"""

file_path = "gerar_pastas.bat"
with open(file_path, "w") as f:
    f.write(bat_content)

print(f"File created successfully.")