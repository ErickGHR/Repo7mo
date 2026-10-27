import { supabase } from '../../supabase';

// Todas las consultas a Supabase viven aquí. Así, los componentes no necesitan
// conocer nombres de tablas ni detalles de la API.
function getClient() {
  if (!supabase) {
    throw new Error(
      'Falta configurar Supabase. Revisa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.',
    );
  }
  return supabase;
}

export async function testConnection() {
  const { error } = await getClient().from('productos').select('id').limit(1);
  if (error) throw error;
}

export async function getProducts() {
  const { data, error } = await getClient()
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createProduct(product) {
  const { error } = await getClient().from('productos').insert(product);
  if (error) throw error;
}

export async function updateProduct(id, product) {
  const { error } = await getClient()
    .from('productos')
    .update(product)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProduct(id) {
  const { error } = await getClient().from('productos').delete().eq('id', id);
  if (error) throw error;
}
