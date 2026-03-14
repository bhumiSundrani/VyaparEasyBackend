import axios from "axios"
import { env } from "../../config/env"

export const fetchImageForProduct = async (query: string) => {
    try {
        const res = await axios.get("https://customsearch.googleapis.com/customsearch/v1", {
            params: {
                key: env.GOOGLE_CUSTOM_SEARCH_API,
                searchType: "image",
                q: query,
                num: 1
            }
        })
        const imageUrl = res.data.items?.[0]?.link
        if(imageUrl) return imageUrl
    } catch (error) {
        console.log("Error fetching product image: ", error)
    }
    return null
}