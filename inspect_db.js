const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://txfgrlupxnusegrkjrjo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZmdybHVweG51c2VncmtqcmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDQzNjAsImV4cCI6MjA4MDEyMDM2MH0.EeIDUXQZq-oTV2u3U5iFeArpGwLBc0ReVpRd1WG_DvU';

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
