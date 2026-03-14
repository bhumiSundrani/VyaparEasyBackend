import axios from "axios"

export const fetchImageForCategory = async (query: string) => {
    try {
        const response = await axios.get('https://api.pexels.com/v1/search', {
            headers: {"Authorization": process.env.PEXELS_API_KEY},
            params: {query: query, per_page: 1}
        })
        const photo = response.data.photos?.[0]
        if(photo) {
            // Log the photo object to see available URLs
            console.log("Pexels photo object:", photo);
            // Use the large2x URL for good quality and reasonable size
            return photo.src.large2x;
        }
        console.log("No photos found for query:", query)
    } catch (error) {
        console.error("Error fetching category images from pexels:", error)
        if (axios.isAxiosError(error)) {
            console.error("API Response:", error.response?.data)
            console.error("Status:", error.response?.status)
        }
    }
    return null
}