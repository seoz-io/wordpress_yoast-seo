import React, { Fragment } from "react";
import { Slot } from "@wordpress/components";

import TwitterView from "../social/TwitterView";

const isPremium = !! window.wpseoPostScraperL10n.isPremium;

/**
 * A
 * @param {*} props A
 *
 * @returns {Component} Renders a React Component.
 */
const TwitterWrapper = ( props ) => {
	return (
		<Fragment>
			{
				! isPremium && <TwitterView isPremium={ isPremium } { ...props } />
			}
			<Slot name="YoastTwitterPremium">
				{
					( fills ) => {
						return fills.map( ( Fill, i ) => <Fill key={ i } { ...props } /> );
					}
				}
			</Slot>
		</Fragment>
	);
};

export default TwitterWrapper;
