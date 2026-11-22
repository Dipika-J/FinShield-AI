function fraudTransaction(){

    const locations=[
        "Mumbai",
        "Bengaluru",
        "Hyderabad",
        "Delhi",
        "Chennai"
    ];

    const methods=[
        "UPI",
        "Credit Card",
        "Debit Card",
        "Net Banking"
    ];

    const devices=[
        "New",
        "Unknown",
        "New",
        "Known"
    ];

    return {
        amount:Math.floor(Math.random()*120000)+35000,
        hour:Math.floor(Math.random()*6),
        frequency:Math.floor(Math.random()*10)+7,
        failed_attempts:Math.floor(Math.random()*4)+2,
        location:locations[Math.floor(Math.random()*locations.length)],
        device:devices[Math.floor(Math.random()*devices.length)],
        payment_method:methods[Math.floor(Math.random()*methods.length)]
    };
}
