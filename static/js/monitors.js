let all_monitors = [];

function combineMonitors(){
    let all_inventory = {};
    let bp_inventory = {};
    for (let monitor of all_monitors) {
        for (let item of monitor.combined_items) {
            if (item.is_blueprint) {
                if (item.id in bp_inventory) {
                    bp_inventory[item.id].quantity += item.quantity;
                } else {
                    bp_inventory[item.id] = {
                        name: item.name,
                        quantity: item.quantity
                    };
                }
            } else {
                if (item.id in all_inventory) {
                    all_inventory[item.id].quantity += item.quantity;
                } else {
                    all_inventory[item.id] = {
                        name: item.name,
                        quantity: item.quantity
                    };
                }
            }
        }
    }
    return{
        items: all_inventory,
        bps: bp_inventory
    }
}

function add_monitor_to_list(monitor){
    let list_id = "monitor-list-" + monitor.id
    let parentDiv = document.getElementById('all-monitors-list');
    let existingMonitorDiv = document.getElementById(list_id);
    if (!existingMonitorDiv) {
        let monitor_div = document.createElement('div');
        monitor_div.id = list_id;
        monitor_div.classList.add('monitor-item');

        let monitor_title = document.createElement('div');
        monitor_title.classList.add('monitor-title');
        monitor_title.innerHTML = monitor.name;
        monitor_div.appendChild(monitor_title);

        parentDiv.appendChild(monitor_div);
    }
}

function add_inventory_item_to_overview(itemId, item, is_blueprint){
    let overview_id = "overview-" + itemId
    let parentDiv = document.getElementById('base-inventory-list');
    let existingItemDiv = document.getElementById(overview_id);
    if (!existingItemDiv) {
        let item_info = findSectionById(itemId)
        let item_div = document.createElement('div');

        item_div.id = overview_id;
        item_div.classList.add('base-inventory-item');
        if(is_blueprint){
            item_div.classList.add('inventory-item-is-blueprint');
        }

        let item_img = document.createElement('img');
        item_img.setAttribute('src', item_info.image);
        item_img.setAttribute('alt', 'Icon');
        item_div.appendChild(item_img);

        let item_count = document.createElement('div');
        item_count.classList.add('base-inventory-item-count');
        item_count.innerHTML = `x${item.quantity}`;
        item_div.appendChild(item_count);

        parentDiv.appendChild(item_div)
    }
}