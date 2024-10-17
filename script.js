const appVersion = '0.0.1';
const storedVersion = localStorage.getItem('appVersion');

if (storedVersion !== appVersion) {
    localStorage.setItem('appVersion', appVersion);
    sessionStorage.clear(); // Clear session storage to invalidate any stored data
    caches.keys().then(cacheNames => {
        cacheNames.forEach(cache => caches.delete(cache)); // Clear all caches
    });
    location.reload(); // Reload the page with new resources
}

document.addEventListener('dblclick', function(e) {
    e.preventDefault(); // Verhindert die Standardaktion des Doppelklicks
});


// Merkliste aus sessionStorage laden
const cart = JSON.parse(sessionStorage.getItem('cart')) || {};
updateWishlist(); // Merkliste-Anzeige beim Laden aktualisieren

// Funktion zum sanften Scrollen zu einer Kategorie
function scrollToCategory(categoryId) {
    const element = document.getElementById(categoryId);
    const offset = 60; // Höhe der Navigation
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
    });
}



// Funktion zum Anzeigen der jeweiligen Navigation und Menü
function showNav(section) {
    // Sanft nach oben scrollen
    window.scrollTo({
        top: 380,
        behavior: 'smooth' // Sanfter Scroll-Effekt
    });

    document.getElementById('NavGetreanke').style.display = 'none';
    document.getElementById('NavDinner').style.display = 'none';
    document.getElementById('NavDrinks').style.display = 'none';
    document.getElementById('ShishaMenu').style.display = 'none';
    document.getElementById('DinnerMenu').style.display = 'none';
    document.getElementById('DrinksMenu').style.display = 'none';

    document.getElementById('shishaBtn').classList.remove('active');
    document.getElementById('dinnerBtn').classList.remove('active');
    document.getElementById('drinksBtn').classList.remove('active');

    if (section === 'Shisha') {
        document.getElementById('NavGetreanke').style.display = 'flex';
        document.getElementById('ShishaMenu').style.display = 'block';
        document.getElementById('shishaBtn').classList.add('active');
    } else if (section === 'Dinner') {
        document.getElementById('NavDinner').style.display = 'flex';
        document.getElementById('DinnerMenu').style.display = 'block';
        document.getElementById('dinnerBtn').classList.add('active');
    } else if (section === 'Drinks') {
        document.getElementById('NavDrinks').style.display = 'flex';
        document.getElementById('DrinksMenu').style.display = 'block';
        document.getElementById('drinksBtn').classList.add('active');
    }

    scrollToActiveButton();
}

// Automatische Auswahl beim Laden der Seite
window.onload = function() {
    const lastActiveButtonId = sessionStorage.getItem('activeButtonId') || 'shishaBtn'; // Standardwert
    document.getElementById(lastActiveButtonId).click(); // Klicke den letzten aktiven Button
};

// Scrollen der Navigation, damit der Button in der Mitte erscheint
const navButtons = document.querySelectorAll('.NavButton'); // Alle Navigations-Buttons

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Button-Position und Navigation-Position ermitteln
        const buttonPosition = button.getBoundingClientRect();
        const nav = button.closest('.Nav');
        const navPosition = nav.getBoundingClientRect();

        // Berechnung des Offsets (mittig scrollen)
        const offset = (buttonPosition.left + buttonPosition.width / 2) 
                       - (navPosition.left + navPosition.width / 2);

        // Stelle sicher, dass der Button nicht der erste oder der letzte ist
        const isFirstButton = button === navButtons[0]; // Erster Button
        const isLastButton = button === navButtons[navButtons.length - 1]; // Letzter Button

        // Nur scrollen, wenn der Button nicht der erste oder letzte ist
        if (!isFirstButton && !isLastButton) {
            let newScrollLeft = nav.scrollLeft + offset;

            // Maximalen und minimalen Scrollwert berechnen
            const maxScrollLeft = nav.scrollWidth - navPosition.width;
            
            // Begrenzen des Scrollwerts, damit er nicht über die Grenzen hinausgeht
            if (newScrollLeft < 0) {
                newScrollLeft = 0;
            } else if (newScrollLeft > maxScrollLeft) {
                newScrollLeft = maxScrollLeft;
            }

            // Scrollen zur Position des Buttons (wenn der Container scrollbar ist)
            nav.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }

        // Setze den aktiven Button
        navButtons.forEach(btn => btn.classList.remove('active')); // Alle aktiven Klassen entfernen
        button.classList.add('active'); // Aktiven Button setzen

        // Speichere den letzten aktiven Button in sessionStorage
        sessionStorage.setItem('activeButtonId', button.id);

        // Den entsprechenden Inhalt anzeigen und andere ausblenden
        const category = button.id.replace('Btn', ''); // Hole den Namen der Kategorie aus dem Button-ID
        const contents = document.querySelectorAll('.NavContent');

        contents.forEach(content => {
            if (content.id === `Nav${category}`) {
                content.style.display = 'block'; // Zeige den entsprechenden Inhalt
            } else {
                content.style.display = 'none'; // Blende andere Inhalte aus
            }
        });
    });
});

// Cart und Wishlist-Funktionen für beide Klassen ('.add-to-cart' und '.SliderShowButton')
// Merkliste und Cart-Funktionen
document.querySelectorAll('.add-to-cart, .SliderShowButton').forEach(button => {
    button.addEventListener('click', () => {
        const productId = button.dataset.productId;
        const productPrice = parseFloat(button.dataset.price);

        // Produkt zur Merkliste hinzufügen
        addToWishlist({ id: productId, price: productPrice });

        // Flash-Animation hinzufügen
        const wishlistButton = document.querySelector('.merklisteButton');
        wishlistButton.classList.add('flash-animation');

        // Entferne die Animation nach dem Ende
        wishlistButton.addEventListener('animationend', () => {
            wishlistButton.classList.remove('flash-animation');
        });
    });
});

// Funktion zum Hinzufügen eines Produkts zur Merkliste
function addToWishlist(product) {
    // Überprüfen, ob das Produkt bereits in der Merkliste ist
    if (cart[product.id]) {
        cart[product.id].quantity++; // Menge erhöhen, wenn Produkt schon vorhanden ist
    } else {
        cart[product.id] = { ...product, quantity: 1 }; // Neues Produkt zur Merkliste hinzufügen
    }

    // Merkliste im sessionStorage speichern
    sessionStorage.setItem('cart', JSON.stringify(cart));

    // Merkliste und Zähler aktualisieren
    updateWishlist();
}

// Funktion zum Aktualisieren der Merkliste und des Zählers
function updateWishlist() {
    let totalItems = 0;

    // Durch alle Produkte in der Merkliste gehen und die Gesamtmenge zählen
    for (const itemId in cart) {
        totalItems += cart[itemId].quantity;
    }

    // Zähler für die Anzahl der Produkte in der Merkliste aktualisieren
    const itemCountElement = document.getElementById('itemCount');
    itemCountElement.textContent = totalItems;

    // Optional: Leere Nachricht anzeigen, wenn keine Produkte vorhanden sind
    const cartEmptyMessage = document.getElementById('cartEmptyMessage');
    if (totalItems === 0) {
        cartEmptyMessage.style.display = 'block'; // Nachricht anzeigen
    } else {
        cartEmptyMessage.style.display = 'none'; // Nachricht ausblenden
    }
}
// Funktion zum Anzeigen der Merkliste im Modal
document.getElementById('cartIcon').addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'block';
    document.querySelector('.NavigationButtom').classList.add('hidden'); // Navigation ausblenden
    renderCart();
});

// Funktion zum Schließen des Modals
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'none';
    document.querySelector('.NavigationButtom').classList.remove('hidden'); // Navigation einblenden
});

// Schließt das Pop-up, wenn irgendwo außerhalb geklickt wird
window.onclick = function(event) {
  if (event.target == document.getElementById("cartModal")) {
    document.getElementById("cartModal").style.display = "none";
  }
}


// Funktion zum Aktualisieren der Merkliste-Anzeige
function updateWishlist() {
    let count = 0;
    for (const item in cart) {
        count += cart[item].quantity;
    }
    document.getElementById('itemCount').innerText = count;
}

// Funktion zum Rendern der Merkliste im Modal
function renderCart() {
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';

    for (const item in cart) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');

        itemDiv.innerHTML = `
            ${item} - Preis: ${cart[item].price.toFixed(2)} € - Anzahl
            <strong>${cart[item].quantity}</strong>
            <button class="remove-single-button" onclick="removeSingleItem('${item}')">-</button>
            <button class="add-single-button" onclick="addSingleItem('${item}')">+</button>
        `;
        cartItemsDiv.appendChild(itemDiv);
    }

    updateTotalPrice();
}


// Funktion zum Aktualisieren des Gesamtpreises
function updateTotalPrice() {
    const totalPriceDiv = document.getElementById('totalPrice');
    let total = 0;
    for (const item in cart) {
        total += cart[item].price * cart[item].quantity;
    }
    totalPriceDiv.innerHTML = `Gesamtpreis: <strong>${total.toFixed(2)}€ </strong>`;
}

// Funktion zum Entfernen eines einzelnen Produkts
function removeSingleItem(productId) {
    if (cart[productId]) {
        cart[productId].quantity -= 1;
        if (cart[productId].quantity <= 0) {
            delete cart[productId];
        }
    }
    updateWishlist();
    renderCart();
}

// Funktion zum Hinzufügen eines einzelnen Produkts
function addSingleItem(productId) {
    if (cart[productId]) {
        cart[productId].quantity += 1;
    }
    updateWishlist();
    renderCart();
}

// Funktion zum Entfernen aller Produkte aus der Merkliste
document.getElementById('removeAllButton').addEventListener('click', () => {
    for (const item in cart) {
        delete cart[item]; // Entferne jedes Produkt aus der Merkliste
    }
    updateWishlist(); // Aktualisiere die Anzeige
    renderCart(); // Aktualisiere die Anzeige im Modal
    sessionStorage.removeItem('cart'); // Leere den Warenkorb im sessionStorage
});

// SliderShow
let slideIndex = 1;
showSlides(slideIndex);

// Wischen hinzufügen
let startX;
let endX;

document.addEventListener('touchstart', function(e) {
    startX = e.changedTouches[0].clientX;
});

document.addEventListener('touchend', function(e) {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
});

function handleSwipe() {
    if (startX > endX + 50) {
        plusSlides(1); // Wisch nach links
    } else if (startX < endX - 50) {
        plusSlides(-1); // Wisch nach rechts
    }
}

// Nächste/Vorherige Steuerung
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// Steuerung für die Dots
function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

// Automatisches Wechseln der Slides alle 3 Sekunden
setInterval(function() {
    plusSlides(1);
}, 3000); // 3000 ms = 3 Sekunden


// Logo Willkommen Einmal anzeigen
window.onload = function() {
    const overlay = document.getElementById('logoOverlay');
    const logo = document.getElementById('logo');
    const shishaBtn = document.getElementById('shishaBtn'); // Button für Shisha-Navigation

    // Überprüfen, ob das Overlay bereits angezeigt wurde
    const overlayShown = sessionStorage.getItem('overlayShown');

    if (!overlayShown) {
        logo.classList.add('show'); // Logo einblenden
        setTimeout(() => {
            overlay.classList.add('hide'); // Klasse zum Ausblenden hinzufügen
            sessionStorage.setItem('overlayShown', 'true'); // Status speichern
            
            // Aktivieren des Shisha-Navigations-Buttons
            shishaBtn.classList.add('active'); 
            // Optional: Zeige auch das Shisha-Menü
            document.getElementById('NavGetreanke').style.display = 'flex';
            document.getElementById('ShishaMenu').style.display = 'block';

        }, 3000); // 3000 Millisekunden (3 Sekunden) warten
    } else {
        overlay.style.display = 'none'; // Overlay direkt ausblenden, wenn bereits angezeigt
        // Aktivieren des Shisha-Navigations-Buttons
        shishaBtn.classList.add('active');
        document.getElementById('NavGetreanke').style.display = 'flex';
        document.getElementById('ShishaMenu').style.display = 'block';
    }
};

// Funktion zum Beobachten der h3-Titel
document.addEventListener("DOMContentLoaded", function() {
    // Beobachte alle h3-Titel
    const categoryTitles = document.querySelectorAll('.TitelMenuKat');
    const navButtons = document.querySelectorAll('.NavButton'); // Alle Navigations-Buttons

    const observerOptions = {
        root: null, // Voller Viewport
        rootMargin: '-120px 0px -120px 0px', // Negativer Wert für die Unterkante, um die Höhe des Headers zu berücksichtigen
        threshold: 0 // Mindestens 50% des Titels sichtbar
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeId = entry.target.id;

                // Den zugehörigen Button aktivieren
                navButtons.forEach(button => {
                    if (button.dataset.target === activeId) {
                        navButtons.forEach(btn => btn.classList.remove('active'));
                        button.classList.add('active');

                        // Speichere den aktiven Button in sessionStorage
                        sessionStorage.setItem('activeButtonId', button.id);

                        // Scroll den Button in die Mitte
                        const buttonPosition = button.getBoundingClientRect();
                        const nav = button.closest('.Nav').getBoundingClientRect();
                        const offset = (buttonPosition.left + buttonPosition.width / 2) 
                                        - (nav.left + nav.width / 2);
                        button.closest('.Nav').scrollBy({
                            left: offset,
                            behavior: 'smooth'
                        });
                    }
                });
            }
        });
    }, observerOptions);

    // Alle Titel beobachten
    categoryTitles.forEach(title => {
        observer.observe(title);
    });
});




// KALENDER HINZUFÜGEN //

function addEventToCalendar(eventTitle, eventDescription, eventLocation, eventStart, eventEnd) {
    // Nutzer um Bestätigung bitten
    const userConfirmed = confirm("Möchten Sie dieses Ereignis herunterladen und Ihrem Kalender hinzufügen?");
    
    if (!userConfirmed) {
        return; // Abbruch, falls Nutzer den Download nicht bestätigen möchte
    }

    // Erstellen des iCalendar-Inhalts
    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Organization//Your Product//EN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${new Date().getTime()}@yourdomain.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(new Date(eventStart))}
DTEND:${formatDate(new Date(eventEnd))}
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription}
LOCATION:${eventLocation}
END:VEVENT
END:VCALENDAR
`;

    // Erstellen einer Blob-Datei
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);

    // Öffnen der Blob-URL zum Herunterladen der .ics-Datei
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event.ics';
    a.click();
    URL.revokeObjectURL(url);
}

// Formatierung der Datumsangaben in YYYYMMDDTHHMMSSZ
function formatDate(date) {
    return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
}


// KAlENDER ENDE //



document.addEventListener("DOMContentLoaded", function () {
    const infoButtons = document.querySelectorAll(".info-button");
    const popup = document.createElement("div");
    const overlay = document.createElement("div");

    overlay.classList.add("popup-overlay");
    document.body.appendChild(overlay);

    popup.classList.add("popup");
    document.body.appendChild(popup);

    infoButtons.forEach(button => {
        button.addEventListener("click", function () {
            const info = button.getAttribute("data-info");
            popup.innerHTML = `<p>${info}</p><button id="close-popup">Schließen</button>`;
            popup.style.display = "block";
            overlay.style.display = "block";
        });
    });

    overlay.addEventListener("click", closePopup);
    popup.addEventListener("click", function (e) {
        if (e.target.id === "close-popup") {
            closePopup();
        }
    });

    function closePopup() {
        popup.style.display = "none";
        overlay.style.display = "none";
    }
});


