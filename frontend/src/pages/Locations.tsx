import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowLeft, Clock, Phone, MessageCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import LinkTreeContainer from "@/components/LinkTreeContainer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { fetchLocations, Location, DaySchedule } from "@/services/locationServices";
import { fetchRestaurantInfo } from "@/services/restaurantInfoService";

const Locations = () => {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    Promise.all([fetchLocations(), fetchRestaurantInfo()])
      .then(([locs, info]) => {
        setLocations(locs);
        if (info?.name) setRestaurantName(info.name);
      })
      .catch((error) => {
        console.error("Failed to fetch data:", error);
        setLocations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatWorkingHours = (daySchedule: DaySchedule) => {
    if (daySchedule.closed) return t("closed");
    return `${daySchedule.open} - ${daySchedule.close}`;
  };

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => (a.location_order ?? 0) - (b.location_order ?? 0)),
    [locations]
  );

  return (
    <LinkTreeContainer title={t("locationsTitle")}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="mb-6 flex justify-center">
        <Button variant="ghost" asChild className="flex items-center gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            <span>{restaurantName || t("Restaurant")}</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading locations...</div>
      ) : (
        <div className="space-y-6">
          {sortedLocations.map((location) => (
            <article
              key={location.id}
              className="rounded-2xl border border-restaurant-primary/10 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-restaurant-dark sm:text-2xl">{location.name}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                      {location.address}, {location.city}
                    </p>
                  </div>

                  {location.is_open_24_7 ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700 sm:text-base">
                      <Clock className="h-4 w-4" />
                      {t("open24_7")}
                    </div>
                  ) : location.working_hours?.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 sm:text-base">
                        <Clock className="h-4 w-4" />
                        <span>{t("workingHours")}</span>
                      </div>
                      <div className="space-y-2">
                        {location.working_hours.map((day) => (
                          <div
                            key={day.day}
                            className={`group flex items-center justify-between rounded-lg border px-4 py-3 transition-all duration-150 ${
                              day.closed
                                ? "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
                                : "border-emerald-200/60 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
                            }`}
                          >
                            <dt className={`text-sm font-medium ${day.closed ? "text-gray-600" : "text-gray-900"}`}>
                              {day.day}
                            </dt>
                            <dd className={`text-sm font-semibold tabular-nums ${day.closed ? "text-gray-400" : "text-emerald-700"}`}>
                              {day.closed ? t("closed") : formatWorkingHours(day)}
                            </dd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-48 sm:items-end">
                  <a
                    href={location.map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-restaurant-primary px-4 py-2 text-sm font-semibold text-restaurant-primary transition hover:bg-restaurant-primary/10 sm:w-auto sm:text-base"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{t("viewOnMap")}</span>
                  </a>

                  {location.phone && (
                    <>
                      <a
                        href={`https://wa.me/${location.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-green-500 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 sm:w-auto sm:text-base"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${location.phone}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-blue-400 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 sm:w-auto sm:text-base"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{t("call") || "Call"}</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </LinkTreeContainer>
  );
};

export default Locations;
