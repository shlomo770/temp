import React, { FC } from "react";
import type { EntityFormCategory } from "../../../enums/entityCategory.enum";
import {
  FaCircleNotch,
  FaEllipsisH,
  FaMinus,
  FaChartPie,
  FaRegSquare,
} from "react-icons/fa";
import { PiPolygonFill } from "react-icons/pi";

export function getEntityTypeLabel(type: string): string {
  switch (type) {
    case "circle":
      return "מעגל";
    case "ellipse":
      return "אליפסה";
    case "polygon":
      return "פוליגון";
    case "line":
      return "קו";
    case "sector":
      return "מגזר (Taboozone)";
    case "rectangle":
      return "מלבן";
    case "target":
      return "Target";
    default:
      return type;
  }
}

export const EntityCategoryBadge: FC<{ category: EntityFormCategory }> = ({ category }) => {
  const short = String(category || "?")
    .trim()
    .slice(0, 3);
  const normalized = short ? short.toUpperCase() : "?";
  return (
    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-sky-500/20 px-1 text-[11px] font-semibold text-sky-300">
      {normalized}
    </span>
  );
};

const commonIcon = "h-3 w-3";

export const EntityTypeGlyph: FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "circle":
      return <FaCircleNotch className={commonIcon} />;
    case "ellipse":
      return <FaEllipsisH className={commonIcon} />;
    case "polygon":
    case "rectangle":
      return <PiPolygonFill className={commonIcon} />;
    case "line":
      return <FaMinus className={commonIcon} />;
    case "sector":
      return <FaChartPie className={commonIcon} />;
    default:
      return <FaRegSquare className={commonIcon} />;
  }
};
