@echo off
REM PiacPro — osszes migracio futtatasa sorrendben (psql vagy Supabase CLI)
REM Hasznalat Supabase CLI-vel (ajanlott):
REM   cd Desktop\project
REM   supabase link --project-ref A_TE_PROJECT_REFED
REM   supabase db push

echo.
echo ============================================
echo  PiacPro Supabase migraciok
echo ============================================
echo.
echo A DB-dben hianyzik az alap schema (listings, profiles stb.).
echo Ne a legujabb fajlt futtasd eloszor!
echo.
echo AJANLOTT: Supabase CLI
echo   supabase link
echo   supabase db push
echo.
echo KEZI (SQL Editor): futtasd a fajlokat SORRENDBEN, egyesevel:
echo.

for /f "delims=" %%f in ('dir /b /on "supabase\migrations\*.sql"') do echo   %%f

echo.
echo Az elso fajl: 20260512061139_create_marketplace_schema.sql
echo.
pause
