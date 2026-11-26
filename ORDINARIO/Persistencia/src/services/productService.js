import { supabase } from '../../supabase';

// Todas las consultas a Supabase viven aquí. Así, los componentes no necesitan
// conocer nombres de tablas ni detalles de la API. Las funciones lanzan errores
// con throw: App.js los captura con try/catch y decide cómo mostrarlos.
function getClient() {
  // Fallamos pronto y con un mensaje claro antes de intentar una llamada de red.
  if (!supabase) {
    throw new Error(
      'Falta configurar Supabase. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.',
    );
  }
  return supabase;
}

export async function testConnection() {
  // SELECT de una sola columna y como máximo una fila: prueba URL, key, tabla y RLS.
  const { error } = await getClient().from('productos').select('id').limit(1);
  if (error) throw error;
}

export async function getProducts() {
  // SELECT * recupera cada columna; ORDER BY pone primero lo recién creado.
  const { data, error } = await getClient()
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createProduct(product) {
  // INSERT envía solo producto, descripcion y precio; id y fecha los crea PostgreSQL.
  const { error } = await getClient().from('productos').insert(product);
  if (error) throw error;
}

export async function updateProduct(id, product) {
  // UPDATE cambia los campos dados. eq añade el filtro WHERE id = ...
  const { error } = await getClient()
    .from('productos')
    .update(product)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProduct(id) {
  // DELETE también se limita a una fila por su id, nunca a toda la tabla.
  const { error } = await getClient().from('productos').delete().eq('id', id);
  if (error) throw error;
}
