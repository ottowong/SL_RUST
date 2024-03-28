let all_monitors = [];
const explosives_list = [
    "143803535", //F1 Grenade
    "-1878475007", // Satchel Charge
    "-1841918730", // High Velocity Rocket
    "1638322904", // Incendiary Rocket
    "1840822026", // Beancan Grenade
    "-1321651331", // Explosive 5.56 Rifle Ammo
    "1248356124", // Timed Explosive Charge
    "-742865266", // Rocket
    "349762871", // 40mm HE Grenade
    "-1843426638", // MLRS Rocket
]

function combineMonitors(){
    let all_inventory = {};
    let bp_inventory = {};
    for (let monitor of all_monitors) {
        if(monitor.combined_items){
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
    }
    return{
        items: all_inventory,
        bps: bp_inventory
    }
}
function add_box_to_list(monitor) {
    let is_tc = monitor.has_protection;
    let prefix = "monitor";
    if (is_tc) {
        prefix = "tc";
    }
    let list_id = `${prefix}-list-${monitor.id}`;
    let parentDiv = document.getElementById(`all-${prefix}s-list`);
    let monitor_wrapper_div = document.getElementById(`${prefix}-list-wrapper-${monitor.id}`);
    if (!monitor_wrapper_div) {
        monitor_wrapper_div = document.createElement('div');
        monitor_wrapper_div.id = `${prefix}-list-wrapper-${monitor.id}`
        monitor_wrapper_div.classList.add(`device-${monitor.id}`)

        let monitor_div = document.createElement('div');
        monitor_div.id = list_id;
        monitor_div.classList.add(`${prefix}-list-item`);

        let img_info = findSectionById("1149964039");
        if (monitor.has_protection) { // if is TC (I think?)
            img_info = findSectionById("-97956382");
        }

        let monitor_img = document.createElement('img');
        monitor_img.setAttribute('src', img_info.image);
        monitor_img.setAttribute('alt', 'Icon');
        monitor_div.appendChild(monitor_img);

        let monitor_title = document.createElement('div');
        monitor_title.classList.add(`${prefix}-list-item-title`);
        monitor_title.innerHTML = monitor.name;
        monitor_div.appendChild(monitor_title);

        let upkeep_span = document.createElement('span');
        upkeep_span.classList.add(`${prefix}-list-item-upkeep`);
        upkeep_span.innerHTML = monitor.protection_time;
        monitor_div.appendChild(upkeep_span);

        monitor_wrapper_div.appendChild(monitor_div);

        parentDiv.appendChild(monitor_wrapper_div);

        if (!is_tc) { // only make an item div if it's not a tc
            add_box_items_to_list(monitor, monitor_wrapper_div);
        }
    } else {
        let existingUpkeepSpan = monitor_wrapper_div.querySelector('.monitor-list-item-upkeep');
        if (existingUpkeepSpan) {
            existingUpkeepSpan.innerHTML = monitor.protection_time;
        }
        if (!is_tc) { // only make an item div if it's not a tc
            add_box_items_to_list(monitor, monitor_wrapper_div);
        }
    }
}

function add_box_items_to_list(monitor, parentDiv) {
    let items = monitor.items;
    let item_wrapper_div = document.getElementById("monitor-items-" + monitor.id); // get existing div if exists
    if (!item_wrapper_div) { // if not exists, create a new one.
        item_wrapper_div = document.createElement("div");
        item_wrapper_div.setAttribute("id", "monitor-items-" + monitor.id);
        item_wrapper_div.classList.add("base-inventory-list");
    } else {
        item_wrapper_div.innerHTML = ""; // empty it
    }
    for (item of items) {
        add_single_item_to_list(item, item_wrapper_div);
    }
    parentDiv.appendChild(item_wrapper_div);
}

function add_single_item_to_list(item, item_wrapper_div){

    let item_info = findSectionById(item.id.toString())
    let item_div = document.createElement('div');

    // item_div.id = overview_id;
    item_div.classList.add('base-inventory-item');
    if(item.is_blueprint){
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

    item_wrapper_div.appendChild(item_div)
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

function add_inventory_item_to_explosives(itemId, item){
    let boom_id = "boom-" + itemId
    let parentDiv = document.getElementById('boom-list');
    let existingItemDiv = document.getElementById(boom_id);
    if (!existingItemDiv) {
        let item_info = findSectionById(itemId)
        let item_div = document.createElement('div');

        item_div.id = boom_id;
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