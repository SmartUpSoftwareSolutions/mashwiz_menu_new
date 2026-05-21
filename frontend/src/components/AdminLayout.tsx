// import React, { useState } from "react";
// import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   ArrowLeft,
//   Shield,
//   MapPin,
//   Share2,
//   Store,
//   Info,
//   Users,
//   LogOut,
// } from "lucide-react";
// import { logout } from "../lib/auth.ts";

// const AdminLayout: React.FC = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   const handleLogout = async () => {
//     try {
//       setIsLoggingOut(true);
//       await logout();
//       navigate("/admin/login");
//     } catch (error) {
//       console.error("Logout failed:", error);
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   const currentPath = location.pathname.split("/").pop() || "";
//   const getActiveTab = () => {
//     switch (currentPath) {
//       case "admin":
//         return "";
//       case "categories":
//         return "categories";
//       case "locations":
//         return "locations";
//       case "social-links":
//         return "social-links";
//       case "restaurant-info":
//         return "restaurant-info";
//       case "customers":
//         return "customers";
//       default:
//         return "";
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b">
//         <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-y-4 md:gap-y-0 md:gap-x-6 flex-wrap">
//           {/* Left: Back + Admin Title */}
//           <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
//             <Link
//               to="/"
//               className="flex items-center text-gray-600 hover:text-black"
//             >
//               <ArrowLeft className="h-4 w-4 mr-1" />
//               Back to Site
//             </Link>
//             <div className="flex items-center">
//               <Shield className="h-5 w-5 text-restaurant-primary mr-2" />
//               <h1 className="text-xl font-bold text-restaurant-dark">
//                 Admin Panel
//               </h1>
//             </div>
//           </div>

//           {/* Right: Logout */}
//           <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
//             <button
//               onClick={handleLogout}
//               disabled={isLoggingOut}
//               className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
//             >
//               {isLoggingOut ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   Logging out...
//                 </>
//               ) : (
//                 <>
//                   <LogOut className="h-4 w-4" />
//                   Logout
//                 </>
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Admin Navigation */}
//         <div className="container mx-auto px-4 pb-1 overflow-x-auto">
//           <Tabs defaultValue="" value={getActiveTab()} className="w-full">
//             <TabsList className="min-w-full overflow-x-auto">
//               <TabsTrigger value="categories" asChild>
//                 <Link to="/admin/categories">Categories</Link>
//               </TabsTrigger>
//               <TabsTrigger value="" asChild>
//                 <Link to="/admin">
//                   <Store className="h-4 w-4 mr-1" /> Menu Items
//                 </Link>
//               </TabsTrigger>
//               <TabsTrigger value="locations" asChild>
//                 <Link to="/admin/locations">
//                   <MapPin className="h-4 w-4 mr-1" /> Locations
//                 </Link>
//               </TabsTrigger>
//               <TabsTrigger value="social-links" asChild>
//                 <Link to="/admin/social-links">
//                   <Share2 className="h-4 w-4 mr-1" /> Social Links
//                 </Link>
//               </TabsTrigger>
//               <TabsTrigger value="restaurant-info" asChild>
//                 <Link to="/admin/restaurant-info">
//                   <Info className="h-4 w-4 mr-1" /> Restaurant Info
//                 </Link>
//               </TabsTrigger>
//               <TabsTrigger value="customers" asChild>
//                 <Link to="/admin/customers">
//                   <Users className="h-4 w-4 mr-1" /> Customers
//                 </Link>
//               </TabsTrigger>
//             </TabsList>
//           </Tabs>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="container mx-auto py-6 px-4">
//         <Outlet />
//       </main>
//     </div>
//   );
// };

// export default AdminLayout;

import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Shield,
  MapPin,
  Share2,
  Store,
  Info,
  Users,
  LogOut,
  Tag,
  ClipboardList,
  MessageSquare,
  GitBranch,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { logout } from "../lib/auth.ts";

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const currentPath = location.pathname.split("/").pop() || "";
  const getActiveTab = () => {
    switch (currentPath) {
      case "admin":
        return "";
      case "categories":
        return "categories";
      case "locations":
        return "locations";
      case "social-links":
        return "social-links";
      case "restaurant-info":
        return "restaurant-info";
      case "customers":
        return "customers";
      case "tags":
        return "tags";
      case "survey-questions":
        return "survey-questions";
      case "survey-responses":
        return "survey-responses";
      case "branches":
        return "branches";
      case "promotions":
        return "promotions";
      case "sync":
        return "sync";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-y-4 md:gap-y-0 md:gap-x-6 flex-wrap">
          {/* Left: Back + Admin Title */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Site
            </Link>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-restaurant-primary mr-2" />
              <h1 className="text-xl font-bold text-restaurant-dark">
                Admin Panel
              </h1>
            </div>
          </div>

          {/* Right: Logout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Logout
                </>
              )}
            </button>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="container mx-auto px-4 pb-1 overflow-x-auto">
          <Tabs defaultValue="" value={getActiveTab()} className="w-full">
            <TabsList className="min-w-full overflow-x-auto">
              <TabsTrigger value="categories" asChild>
                <Link to="/admin/categories">Categories</Link>
              </TabsTrigger>
              <TabsTrigger value="" asChild>
                <Link to="/admin">
                  <Store className="h-4 w-4 mr-1" /> Menu Items
                </Link>
              </TabsTrigger>
              <TabsTrigger value="locations" asChild>
                <Link to="/admin/locations">
                  <MapPin className="h-4 w-4 mr-1" /> Locations
                </Link>
              </TabsTrigger>
              <TabsTrigger value="social-links" asChild>
                <Link to="/admin/social-links">
                  <Share2 className="h-4 w-4 mr-1" /> Social Links
                </Link>
              </TabsTrigger>
              <TabsTrigger value="restaurant-info" asChild>
                <Link to="/admin/restaurant-info">
                  <Info className="h-4 w-4 mr-1" /> Restaurant Info
                </Link>
              </TabsTrigger>
              <TabsTrigger value="customers" asChild>
                <Link to="/admin/customers">
                  <Users className="h-4 w-4 mr-1" /> Customers
                </Link>
              </TabsTrigger>
              <TabsTrigger value="tags" asChild>
                <Link to="/admin/tags">
                  <Tag className="h-4 w-4 mr-1" /> Tags
                </Link>
              </TabsTrigger>
              <TabsTrigger value="survey-questions" asChild>
                <Link to="/admin/survey-questions">
                  <ClipboardList className="h-4 w-4 mr-1" /> Survey Questions
                </Link>
              </TabsTrigger>
              <TabsTrigger value="survey-responses" asChild>
                <Link to="/admin/survey-responses">
                  <MessageSquare className="h-4 w-4 mr-1" /> Survey Responses
                </Link>
              </TabsTrigger>
              <TabsTrigger value="branches" asChild>
                <Link to="/admin/branches">
                  <GitBranch className="h-4 w-4 mr-1" /> Branches
                </Link>
              </TabsTrigger>
              <TabsTrigger value="promotions" asChild>
                <Link to="/admin/promotions">
                  <Megaphone className="h-4 w-4 mr-1" /> Promotions
                </Link>
              </TabsTrigger>
              <TabsTrigger value="sync" asChild>
                <Link to="/admin/sync">
                  <RefreshCw className="h-4 w-4 mr-1" /> ERP Sync
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
