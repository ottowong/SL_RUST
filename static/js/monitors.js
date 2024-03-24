let all_monitors = [];

function combineMonitors(all_monitors){
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

function add_inventory_item_to_overview(itemId, item, is_blueprint){
    let parentDiv = document.getElementById('base-inventory-list');
    let existingItemDiv = document.getElementById(itemId);
    if (!existingItemDiv) {
        let item_info = findSectionById(itemId)
        let item_div = document.createElement('div');

        item_div.id = itemId;
        item_div.classList.add('base-inventory-item');

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