import axios from "axios";
import { useSaveRestaurantInfo } from "../services/restaurantInfoService.ts"; // Adjust path to your service file

export const handleSaveRestaurantInfo = async (
  name: string,
  slogan: string | null,
  file: File | null, // File input for logo
  removeLogo: boolean = false, // Default to false
  themeId: string | null = null, // Default to null
  dbName: string | null = null, // Default to null
  showAllCategory: boolean = true // Default to true
) => {
  const { mutate } = useSaveRestaurantInfo();

  try {
    let logoUrl: string | null = null;

    if (file && !removeLogo) {
      // Upload image to backend
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}api/image/uploadImage`,
        formData,
        { withCredentials: true } // Needed for clientId cookie
      );

      // Extract the first URL from the response
      logoUrl = uploadResponse.data.fileUrls[0];
      if (!logoUrl) {
        throw new Error("No file URL returned from upload");
      }
    }

    // Call the mutation with defined values
    mutate(
      {
        name,
        slogan,
        logoUrl, // string | null
        removeLogo, // boolean
        themeId, // string | null
        show_all_category: showAllCategory, // boolean
        branch_code: null,
        style: null
      },
      {
        onSuccess: () => {
          console.log("Restaurant info saved successfully");
        },
        onError: (error) => {
          console.error("Failed to save restaurant info:", error);
        },
      }
    );
  } catch (error) {
    console.error("Error in handleSaveRestaurantInfo:", error);
    throw error; // Re-throw to handle in UI if needed
  }
};