import axios from "axios";

export const createInventory = (card, images, prices) => {

    const formData = new FormData();

    formData.append("code", card.code);

    formData.append(
        "total_stock",
        card.total_stock
    );

    // Append every selected image under the same key so Django
    // can collect them with request.FILES.getlist("images")
    images.forEach((file) => formData.append("images", file));

    formData.append(
        "prices",
        JSON.stringify(prices)
    );

    return axios.post(
        "/api/inventory/",
        formData
    );
};

export const getInventory = () =>
    axios.get("/api/inventory/").then((r) => r.data);