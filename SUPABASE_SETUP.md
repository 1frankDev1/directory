# Configuración de Supabase para Autenticación de Usuario (Sin Email)

Para que el sistema de "Usuario y Contraseña" funcione correctamente sin mostrar errores de email ni requerir confirmación, debes realizar los siguientes ajustes en tu Dashboard de Supabase:

### 1. Desactivar Confirmación de Email
Esto permitirá que los usuarios entren inmediatamente después de registrarse sin esperar un correo (que además no recibirán porque estamos usando dominios ficticios).

1. Ve a **Authentication** > **Providers**.
2. Despliega la sección **Email**.
3. **Desactiva** la opción "Confirm email".
4. Haz clic en **Save**.

### 2. Aumentar Límites de Registro (Opcional pero Recomendado)
Si ves el error "rate limit exceeded", es porque Supabase limita cuántos usuarios pueden registrarse desde la misma IP en poco tiempo.

1. Ve a **Authentication** > **Settings**.
2. Busca la sección **Rate Limits**.
3. Aumenta los valores de:
   - **Signup capacity**: (Ej. 10 por hora)
   - **Email capacity**: (Aunque no usemos email real, Supabase aplica este límite al motor de Auth).
4. Haz clic en **Save**.

### 3. Configurar Trigger de Perfil (Si no existe)
El sistema espera que cada usuario en `auth.users` tenga una fila correspondiente en la tabla `profiles`. Lo ideal es que esto se haga automáticamente con una función SQL:

```sql
-- Función para crear perfil automáticamente
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger al registrarse
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Ejecuta esto en el **SQL Editor** de Supabase si los perfiles no se están creando automáticamente.
