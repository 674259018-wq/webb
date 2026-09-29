// ======================================================
// DEPORENT APP
// ======================================================


// ======================================================
// CONTRACT ADDRESS
// ======================================================

const CONTRACT_ADDRESS =
    "0x1cc90b26c8c7311f301c6b74f6254af3a503de87";


// ======================================================
// CONTRACT ABI
// ======================================================

const CONTRACT_ABI = [

    "function itemCount() view returns (uint256)",

    "function items(uint256) view returns (uint256 id, string name, string description, string image, uint256 deposit, bool available)",

    "function rentals(uint256) view returns (address borrower, uint256 itemId, uint256 deposit, uint256 borrowedAt, bool returned)",

    "function borrowItem(uint256 itemId) payable",

    "function returnItem(uint256 itemId)",

    "function getItem(uint256 itemId) view returns (uint256, string, string, string, uint256, bool)"

];


// ======================================================
// DEFAULT ITEMS
// ======================================================

const DEFAULT_ITEMS = [

    {
        id: 1,
        name: "Power Bank #001",
        description: "Power Bank 10000mAh สำหรับยืมใช้งาน",
        image: "https://hocothailand.co.th/wp-content/uploads/2023/06/Power-Bank-PD20W-W1108White-10000mAh-%E0%B8%9E%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%A7%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B9%81%E0%B8%9A%E0%B8%87%E0%B8%84%E0%B9%8C-Maxx.jpg",
        deposit: "0.001",
        available: true
    },

    {
        id: 2,
        name: "Headphone #001",
        description: "หูฟังคุณภาพสูง สำหรับยืมใช้งาน",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
        deposit: "0.002",
        available: true
    },

    {
        id: 3,
        name: "Camera #001",
        description: "กล้องถ่ายภาพ สำหรับยืมใช้งาน",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
        deposit: "0.005",
        available: true
    },

    {
        id: 4,
        name: "Notebook #001",
        description: "Notebook สำหรับเรียนและทำงาน",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
        deposit: "0.01",
        available: true
    },

    {
        id: 5,
        name: "Projector #001",
        description: "โปรเจกเตอร์สำหรับนำเสนองาน",
        image: "https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=900&q=80",
        deposit: "0.008",
        available: true
    },

    {
        id: 6,
        name: "Game Controller #001",
        description: "จอยเกมสำหรับยืมเล่นเกม",
        image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=900&q=80",
        deposit: "0.003",
        available: true
    }

];


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let provider = null;
let signer = null;
let contract = null;
let userAddress = null;


// ======================================================
// PAGE LOAD
// ======================================================

window.addEventListener("load", async function () {

    // แสดงรายการทันที
    renderItems(DEFAULT_ITEMS);
    updateStats(DEFAULT_ITEMS);

    // ตรวจสอบ MetaMask
    if (typeof window.ethereum === "undefined") {

        showToast(
            "กรุณาติดตั้ง MetaMask เพื่อยืมอุปกรณ์"
        );

        return;
    }

    // ตรวจสอบ Wallet ที่เคยเชื่อมต่อ
    try {

        provider = new ethers.BrowserProvider(
            window.ethereum
        );

        const accounts = await provider.send(
            "eth_accounts",
            []
        );

        if (accounts.length > 0) {

            await setupWallet();

        }

    } catch (error) {

        console.log(
            "Wallet not connected:",
            error
        );

    }

});


// ======================================================
// SETUP WALLET
// ======================================================

async function setupWallet() {

    try {

        provider = new ethers.BrowserProvider(
            window.ethereum
        );

        signer = await provider.getSigner();

        userAddress = await signer.getAddress();

        // สร้าง Contract
        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );

        updateWalletUI();

        // โหลดข้อมูล Blockchain
        await loadBlockchainItems();

        // โหลดรายการที่กำลังยืม
        await loadMyRentals();

    } catch (error) {

        console.error(
            "Setup wallet error:",
            error
        );

        signer = null;
        contract = null;
        userAddress = null;

    }

}


// ======================================================
// CONNECT WALLET
// ======================================================

async function connectWallet() {

    if (typeof window.ethereum === "undefined") {

        alert(
            "กรุณาติดตั้ง MetaMask ก่อนใช้งาน"
        );

        return;
    }

    try {

        provider = new ethers.BrowserProvider(
            window.ethereum
        );

        // เปิด MetaMask
        await provider.send(
            "eth_requestAccounts",
            []
        );

        // Setup
        await setupWallet();

        if (userAddress) {

            showToast(
                "เชื่อมต่อ MetaMask สำเร็จ ✓"
            );

        }

    } catch (error) {

        console.error(
            "Connect error:",
            error
        );

        if (error.code === 4001) {

            showToast(
                "คุณยกเลิกการเชื่อมต่อ Wallet"
            );

        } else {

            showToast(
                "ไม่สามารถเชื่อมต่อ MetaMask"
            );

        }

    }

}


// ======================================================
// WALLET UI
// ======================================================

function updateWalletUI() {

    const button =
        document.getElementById("connectBtn");

    const wallet =
        document.getElementById("walletAddress");

    if (!button || !wallet) {
        return;
    }

    if (!userAddress) {

        button.innerText =
            "🦊 Connect MetaMask";

        wallet.innerText =
            "Wallet: Not Connected";

        return;
    }

    const shortAddress =
        userAddress.substring(0, 6) +
        "..." +
        userAddress.substring(
            userAddress.length - 4
        );

    button.innerText =
        "🟢 " + shortAddress;

    wallet.innerText =
        "Wallet: " + shortAddress;

}


// ======================================================
// RENDER ITEMS
// ======================================================

function renderItems(items) {

    const container =
        document.getElementById("itemsContainer");

    if (!container) {
        console.error(
            "ไม่พบ #itemsContainer"
        );
        return;
    }

    if (!items || items.length === 0) {

        container.innerHTML = `
            <div class="empty">
                ยังไม่มีอุปกรณ์
            </div>
        `;

        return;
    }

    let html = "";

    items.forEach(function (item) {

        html += createItemCard(item);

    });

    container.innerHTML = html;

}


// ======================================================
// CREATE ITEM CARD
// ======================================================

function createItemCard(item) {

    const statusClass =
        item.available
            ? "available"
            : "rented";

    const statusText =
        item.available
            ? "● พร้อมให้ยืม"
            : "● กำลังถูกยืม";

    return `

        <div class="item-card">

            <img
                class="item-image"
                src="${item.image}"
                alt="${item.name}"
                onerror="this.src='https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'"
            >

            <div class="item-content">

                <div class="status ${statusClass}">
                    ${statusText}
                </div>

                <h3>
                    ${item.name}
                </h3>

                <p class="description">
                    ${item.description}
                </p>

                <div class="item-bottom">

                    <div class="deposit">

                        <small>
                            เงินมัดจำ
                        </small>

                        <strong>
                            ${item.deposit} ETH
                        </strong>

                    </div>

                    <button
                        class="borrow-btn"
                        ${item.available ? "" : "disabled"}
                        onclick="borrowItem(${item.id})"
                    >

                        ${
                            item.available
                                ? "ยืมอุปกรณ์"
                                : "ถูกยืมแล้ว"
                        }

                    </button>

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// LOAD BLOCKCHAIN ITEMS
// ======================================================

async function loadBlockchainItems() {

    try {

        if (!contract) {
            return;
        }

        const count =
            await contract.itemCount();

        const total =
            Number(count);

        const blockchainItems = [];

        for (
            let i = 1;
            i <= total;
            i++
        ) {

            const item =
                await contract.items(i);

            blockchainItems.push({

                id: Number(item.id),

                name: item.name,

                description: item.description,

                image: item.image,

                deposit:
                    ethers.formatEther(
                        item.deposit
                    ),

                available:
                    item.available

            });

        }

        renderItems(
            blockchainItems
        );

        updateStats(
            blockchainItems
        );

    } catch (error) {

        console.error(
            "Blockchain loading error:",
            error
        );

        // ถ้าโหลด Blockchain ไม่ได้
        // ยังคงแสดงรายการ Default
        renderItems(DEFAULT_ITEMS);
        updateStats(DEFAULT_ITEMS);

    }

}


// ======================================================
// LOAD ITEMS BUTTON
// ======================================================

async function loadItems() {

    if (!contract) {

        renderItems(DEFAULT_ITEMS);

        updateStats(DEFAULT_ITEMS);

        showToast(
            "แสดงรายการอุปกรณ์แล้ว"
        );

        return;
    }

    await loadBlockchainItems();

}


// ======================================================
// UPDATE STATS
// ======================================================

function updateStats(items) {

    const total =
        items.length;

    const available =
        items.filter(
            item => item.available
        ).length;

    const rented =
        total - available;

    const totalElement =
        document.getElementById("totalItems");

    const availableElement =
        document.getElementById("availableItems");

    const rentedElement =
        document.getElementById("rentedItems");

    if (totalElement) {
        totalElement.innerText = total;
    }

    if (availableElement) {
        availableElement.innerText = available;
    }

    if (rentedElement) {
        rentedElement.innerText = rented;
    }

}


// ======================================================
// BORROW ITEM
// ======================================================

async function borrowItem(itemId) {

    try {

        // ยังไม่ได้ Connect
        if (!signer) {

            showToast(
                "กรุณา Connect MetaMask ก่อน"
            );

            await connectWallet();

            if (!signer) {
                return;
            }

        }

        // อ่านข้อมูล Item
        const item =
            await contract.items(itemId);

        const deposit =
            item.deposit;

        const depositETH =
            ethers.formatEther(
                deposit
            );

        const confirmed =
            confirm(
                "ยืนยันการยืม\n\n" +
                "อุปกรณ์: " +
                item.name +
                "\nเงินมัดจำ: " +
                depositETH +
                " ETH"
            );

        if (!confirmed) {
            return;
        }

        showToast(
            "กำลังเปิด MetaMask..."
        );

        const tx =
            await contract.borrowItem(
                itemId,
                {
                    value: deposit
                }
            );

        showToast(
            "กำลังรอ Blockchain..."
        );

        await tx.wait();

        showToast(
            "ยืมอุปกรณ์สำเร็จ ✓"
        );

        await loadBlockchainItems();

        await loadMyRentals();

    } catch (error) {

        console.error(
            "Borrow error:",
            error
        );

        handleError(error);

    }

}


// ======================================================
// RETURN ITEM
// ======================================================

async function returnItem(itemId) {

    try {

        if (!signer) {

            await connectWallet();

        }

        if (!signer) {
            return;
        }

        const confirmed =
            confirm(
                "ยืนยันการคืนอุปกรณ์?"
            );

        if (!confirmed) {
            return;
        }

        showToast(
            "กำลังคืนอุปกรณ์..."
        );

        const tx =
            await contract.returnItem(
                itemId
            );

        showToast(
            "กำลังรอ Blockchain..."
        );

        await tx.wait();

        showToast(
            "คืนอุปกรณ์สำเร็จ และได้รับเงินมัดจำคืน ✓"
        );

        await loadBlockchainItems();

        await loadMyRentals();

    } catch (error) {

        console.error(
            "Return error:",
            error
        );

        handleError(error);

    }

}


// ======================================================
// MY RENTALS
// ======================================================

async function loadMyRentals() {

    const container =
        document.getElementById(
            "myRentalContainer"
        );

    if (!container) {
        return;
    }

    if (
        !userAddress ||
        !contract
    ) {

        container.innerHTML = `
            <div class="empty">
                🦊 Connect MetaMask
                เพื่อดูรายการยืม
            </div>
        `;

        return;
    }

    try {

        const count =
            await contract.itemCount();

        let html = "";

        let found = false;

        for (
            let i = 1;
            i <= Number(count);
            i++
        ) {

            const rental =
                await contract.rentals(i);

            const borrower =
                rental.borrower;

            if (
                borrower.toLowerCase() ===
                userAddress.toLowerCase() &&
                !rental.returned
            ) {

                found = true;

                const item =
                    await contract.items(i);

                const deposit =
                    ethers.formatEther(
                        rental.deposit
                    );

                const borrowedAt =
                    Number(
                        rental.borrowedAt
                    );

                const date =
                    new Date(
                        borrowedAt * 1000
                    );

                html += `

                    <div class="rental-card">

                        <div>

                            <h3>
                                ${item.name}
                            </h3>

                            <p>
                                เงินมัดจำ:
                                ${deposit} ETH
                            </p>

                            <small>
                                ยืมเมื่อ:
                                ${date.toLocaleString("th-TH")}
                            </small>

                        </div>

                        <button
                            class="return-btn"
                            onclick="returnItem(${i})"
                        >
                            คืนอุปกรณ์
                        </button>

                    </div>

                `;

            }

        }

        if (!found) {

            html = `
                <div class="empty">
                    ไม่มีอุปกรณ์ที่กำลังยืม
                </div>
            `;

        }

        container.innerHTML =
            html;

    } catch (error) {

        console.error(
            "Rental loading error:",
            error
        );

        container.innerHTML = `
            <div class="empty">
                ไม่สามารถโหลดข้อมูลการยืมได้
            </div>
        `;

    }

}


// ======================================================
// ERROR HANDLER
// ======================================================

function handleError(error) {

    console.error(
        error
    );

    if (error.code === 4001) {

        showToast(
            "คุณยกเลิก Transaction"
        );

        return;
    }

    if (error.reason) {

        showToast(
            error.reason
        );

        return;
    }

    if (error.shortMessage) {

        showToast(
            error.shortMessage
        );

        return;
    }

    if (error.message) {

        if (
            error.message.includes(
                "insufficient funds"
            )
        ) {

            showToast(
                "ETH ในกระเป๋าไม่พอสำหรับเงินมัดจำและค่า Gas"
            );

            return;
        }

        showToast(
            error.message
        );

        return;
    }

    showToast(
        "Transaction ไม่สำเร็จ"
    );

}


// ======================================================
// TOAST
// ======================================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.innerText =
        message;

    toast.classList.add(
        "show"
    );

    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

        },
        3500
    );

}


// ======================================================
// SCROLL
// ======================================================

function goToItems() {

    const items =
        document.getElementById("items");

    if (items) {

        items.scrollIntoView({
            behavior: "smooth"
        });

    }

}


// ======================================================
// METAMASK ACCOUNT CHANGE
// ======================================================

if (
    typeof window.ethereum !== "undefined"
) {

    window.ethereum.on(
        "accountsChanged",
        async function (accounts) {

            if (accounts.length === 0) {

                signer = null;
                provider = null;
                contract = null;
                userAddress = null;

                updateWalletUI();

                renderItems(DEFAULT_ITEMS);
                updateStats(DEFAULT_ITEMS);

                await loadMyRentals();

                showToast(
                    "ยกเลิกการเชื่อมต่อ MetaMask แล้ว"
                );

            } else {

                await setupWallet();

            }

        }
    );


    window.ethereum.on(
        "chainChanged",
        function () {

            // โหลดใหม่เมื่อเปลี่ยน Network
            window.location.reload();

        }
    );

}