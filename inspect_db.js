const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
    console.log('Attempting to list tables...');

    // 1. Try information_schema (often blocked for anon)
    const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public');

    if (!schemaError && schemaData) {
        console.log('Success via information_schema!');
        console.log('Tables:', schemaData.map(t => t.table_name));
        return;
    } else {
        console.log('information_schema blocked or empty. Error:', schemaError?.message);
    }

    // 2. Probe common tables (English & Spanish)
    const commonTables = [
        // English
        'users', 'profiles', 'orders', 'products', 'items', 'cart', 'categories', 'stores', 'order_items',
        // Spanish
        'usuarios', 'perfiles', 'pedidos', 'ordenes', 'productos', 'items_pedido', 'carrito', 'categorias', 'tiendas', 'clientes'
    ];
    console.log('\nProbing common tables...');

    for (const table of commonTables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (!error) {
            console.log(`[FOUND] ${table} (Access OK)`);
        } else {
            console.log(`[MISSING/BLOCKED] ${table}: ${error.message}`);
        }
    }
}

inspect();
